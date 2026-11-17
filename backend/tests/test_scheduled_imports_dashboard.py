from datetime import date, timedelta

from app.services.scheduled_service import first_run_date, next_run_after
from tests.conftest import register


def test_schedule_math():
    """Monthly schedules keep the chosen day and clamp to short months; weekly adds seven days."""
    assert next_run_after(date(2026, 1, 31), "monthly", 31) == date(2026, 2, 28)
    assert next_run_after(date(2026, 2, 28), "monthly", 31) == date(2026, 3, 31)
    assert next_run_after(date(2026, 11, 5), "weekly", None) == date(2026, 11, 12)
    assert next_run_after(date(2026, 3, 10), "yearly", 10) == date(2027, 3, 10)
    assert first_run_date(date(2026, 11, 20), "monthly", 5) == date(2026, 12, 5)
    assert first_run_date(date(2026, 11, 3), "monthly", 5) == date(2026, 11, 5)
    assert first_run_date(date(2026, 11, 3), "weekly", None) == date(2026, 11, 3)


def test_scheduled_materialises_past_occurrences_and_toggle(client):
    """A monthly schedule that started three months ago creates the past occurrences immediately."""
    headers = register(client, "s@example.com")
    start = (date.today().replace(day=1) - timedelta(days=80)).replace(day=1)
    res = client.post(
        "/api/scheduled-transactions",
        json={
            "title": "Gym",
            "amount": 150,
            "typeId": "type_expense",
            "categoryId": "cat_health",
            "interval": "monthly",
            "dayOfMonth": 1,
            "startDate": start.isoformat(),
        },
        headers=headers,
    )
    assert res.status_code == 201, res.text
    sched = res.json()
    assert date.fromisoformat(sched["nextRunDate"]) > date.today()

    txs = client.get("/api/transactions", headers=headers).json()
    assert txs["total"] >= 3
    assert all(t["source"] == "scheduled" and t["title"] == "Gym" for t in txs["items"])

    paused = client.post(f"/api/scheduled-transactions/{sched['id']}/toggle", json={"isActive": False}, headers=headers)
    assert paused.status_code == 200 and paused.json()["isActive"] is False

    listed = client.get("/api/scheduled-transactions", headers=headers).json()
    assert len(listed) == 1

    bad = client.post(
        "/api/scheduled-transactions",
        json={
            "title": "Bad",
            "amount": 1,
            "typeId": "type_expense",
            "categoryId": "cat_health",
            "interval": "monthly",
            "dayOfMonth": 1,
            "startDate": "2026-11-10",
            "endDate": "2026-11-01",
        },
        headers=headers,
    )
    assert bad.status_code == 422

    assert client.delete(f"/api/scheduled-transactions/{sched['id']}", headers=headers).status_code == 204
    assert client.get("/api/scheduled-transactions", headers=headers).json() == []
    # Generated transactions survive deleting the template.
    assert client.get("/api/transactions", headers=headers).json()["total"] >= 3


def test_import_skips_duplicates(client):
    """Committing the same rows twice inserts them once."""
    headers = register(client, "i@example.com")
    payload = {
        "fileName": "bank.csv",
        "source": "bank",
        "rows": [
            {"date": "2026-11-01", "title": "Salary - ACME", "amount": 15000, "type": "income", "categoryId": "cat_salary"},
            {"date": "2026-11-02", "title": "Rent", "amount": 5200, "type": "expense", "categoryId": "cat_rent"},
            {"date": "2026-11-03", "title": "Shufersal", "amount": 412.3, "type": "expense", "categoryId": ""},
        ],
    }
    first = client.post("/api/imports", json=payload, headers=headers)
    assert first.status_code == 201
    assert first.json()["inserted"] == 3 and first.json()["skippedDuplicates"] == 0

    second = client.post("/api/imports", json=payload, headers=headers).json()
    assert second["inserted"] == 0 and second["skippedDuplicates"] == 3

    items = client.get("/api/transactions", headers=headers).json()["items"]
    uncategorised = next(t for t in items if t["title"] == "Shufersal")
    assert uncategorised["categoryId"] == "cat_other_expense" and uncategorised["source"] == "import"


def test_dashboard_summary(client):
    """Totals, category ranking, monthly series and the `from` alias are all present."""
    headers = register(client, "d@example.com")
    for title, amount, type_id, cat in (
        ("Salary", 10000, "type_income", "cat_salary"),
        ("Rent", 4000, "type_expense", "cat_rent"),
        ("Food", 1000, "type_expense", "cat_groceries"),
    ):
        client.post(
            "/api/transactions",
            json={"date": "2026-11-05", "title": title, "amount": amount, "typeId": type_id, "categoryId": cat},
            headers=headers,
        )
    res = client.get("/api/dashboard/summary", params={"from": "2026-11-01", "to": "2026-11-30"}, headers=headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["from"] == "2026-11-01" and body["to"] == "2026-11-30"
    assert body["totalIncome"] == 10000 and body["totalExpense"] == 5000 and body["balance"] == 5000
    assert [c["categoryName"] for c in body["byCategory"]] == ["rent", "groceries"]
    assert len(body["byMonth"]) >= 6 and body["byMonth"][-1]["month"] == "2026-11"
    assert len(body["recentTransactions"]) == 3
    assert body["latestInsights"] == []


def test_insights_rule_based_without_api_key(client):
    """Without an Anthropic key the rule engine produces insights that are then listed."""
    headers = register(client, "ai@example.com")
    today = date.today().isoformat()
    client.post(
        "/api/transactions",
        json={"date": today, "title": "Salary", "amount": 12000, "typeId": "type_income", "categoryId": "cat_salary"},
        headers=headers,
    )
    client.post(
        "/api/transactions",
        json={"date": today, "title": "Rent", "amount": 5000, "typeId": "type_expense", "categoryId": "cat_rent"},
        headers=headers,
    )
    gen = client.post("/api/insights/generate", headers=headers)
    assert gen.status_code == 201, gen.text
    created = gen.json()
    en = [i for i in created if i["language"] == "en"]
    he = [i for i in created if i["language"] == "he"]
    assert len(en) == len(he) >= 2, "every insight is stored once per language"
    titles = [i["title"] for i in en]
    assert "Biggest spending category" in titles and "Savings rate" in titles
    assert "Rent accounts for 100%" in en[0]["body"]
    assert he[0]["title"] == "קטגוריית ההוצאה הגדולה"
    assert "שכר דירה ומשכנתא היא 100%" in he[0]["body"]

    listed = client.get("/api/insights", headers=headers).json()
    assert len(listed) == len(created)
    assert [i["title"] for i in listed if i["language"] == "en"] == titles, "newest-first keeps the generated order"

    # A newer generation replaces the dashboard set.
    client.post("/api/insights/generate", headers=headers)
    summary = client.get("/api/dashboard/summary", params={"from": "2020-01-01", "to": "2030-01-01"}, headers=headers).json()
    latest = summary["latestInsights"]
    assert len(latest) == len(created)
    assert {i["language"] for i in latest} == {"en", "he"}
    assert not {i["id"] for i in latest} & {i["id"] for i in created}


def test_fixed_vs_variable_and_savings_goal(client):
    """Scheduled expenses count as fixed; the savings goal shapes this month's left-to-spend bar."""
    headers = register(client, "goal@example.com")
    today = date.today().isoformat()
    client.post(
        "/api/transactions",
        json={"date": today, "title": "Salary", "amount": 10000, "typeId": "type_income", "categoryId": "cat_salary"},
        headers=headers,
    )
    client.post(
        "/api/transactions",
        json={"date": today, "title": "Food", "amount": 1500, "typeId": "type_expense", "categoryId": "cat_groceries"},
        headers=headers,
    )
    # Starts today, so it runs at once and becomes a fixed (scheduled) expense.
    sched = client.post(
        "/api/scheduled-transactions",
        json={"title": "Rent", "amount": 4000, "typeId": "type_expense", "categoryId": "cat_rent",
              "interval": "monthly", "dayOfMonth": date.today().day, "startDate": today},
        headers=headers,
    )
    assert sched.status_code == 201, sched.text

    params = {"from": today[:8] + "01", "to": "2030-12-31"}
    body = client.get("/api/dashboard/summary", params=params, headers=headers).json()
    assert body["fixedExpense"] == 4000 and body["variableExpense"] == 1500
    mb = body["monthBudget"]
    assert mb["goal"] is None and mb["income"] == 10000 and mb["expense"] == 5500
    assert mb["upcomingFixed"] == 0, "next month's rent is not set aside this month"
    assert mb["spendable"] == 10000 and mb["leftToSpend"] == 4500

    res = client.put("/api/dashboard/savings-goal", json={"amount": 3000}, headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["goal"] == 3000 and res.json()["spendable"] == 7000 and res.json()["leftToSpend"] == 1500
    assert client.get("/api/dashboard/summary", params=params, headers=headers).json()["monthBudget"]["goal"] == 3000

    assert client.put("/api/dashboard/savings-goal", json={"amount": -5}, headers=headers).status_code == 422
    assert client.put("/api/dashboard/savings-goal", json={"amount": None}, headers=headers).json()["goal"] is None
