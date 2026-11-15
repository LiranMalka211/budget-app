from tests.conftest import register


def test_lookups_are_seeded(client):
    """Types and built-in categories exist after startup."""
    headers = register(client, "l@example.com")
    types = client.get("/api/transaction-types", headers=headers).json()
    assert {t["type"] for t in types} == {"income", "expense"}
    cats = client.get("/api/categories", headers=headers).json()
    assert any(c["id"] == "cat_groceries" for c in cats)

    created = client.post("/api/categories", json={"name": "Pets", "typeId": "type_expense"}, headers=headers)
    assert created.status_code == 201 and created.json()["name"] == "Pets"


def test_transaction_crud_filters_and_paging(client):
    """Create, filter by type/category/search/date, page, update and delete."""
    headers = register(client, "t@example.com")

    def add(title, amount, type_id, cat, day):
        res = client.post(
            "/api/transactions",
            json={"date": f"2026-11-{day:02d}", "title": title, "amount": amount, "typeId": type_id, "categoryId": cat, "note": "n"},
            headers=headers,
        )
        assert res.status_code == 201, res.text
        return res.json()

    salary = add("Salary", 15000, "type_income", "cat_salary", 10)
    add("Shufersal", 412.3, "type_expense", "cat_groceries", 3)
    add("Rami Levy", 268.45, "type_expense", "cat_groceries", 9)
    add("Gym", 150, "type_expense", "cat_health", 5)

    page = client.get("/api/transactions", params={"pageSize": 2}, headers=headers).json()
    assert page["total"] == 4 and len(page["items"]) == 2
    assert page["items"][0]["title"] == "Salary"  # newest date first
    assert page["pageSize"] == 2

    assert client.get("/api/transactions", params={"typeId": "type_income"}, headers=headers).json()["total"] == 1
    assert client.get("/api/transactions", params={"categoryId": "cat_groceries"}, headers=headers).json()["total"] == 2
    assert client.get("/api/transactions", params={"search": "rami"}, headers=headers).json()["total"] == 1
    assert client.get("/api/transactions", params={"from": "2026-11-05", "to": "2026-11-09"}, headers=headers).json()["total"] == 2

    upd = client.put(
        f"/api/transactions/{salary['id']}",
        json={"date": "2026-11-11", "title": "Salary Nov", "amount": 15500, "typeId": "type_income", "categoryId": "cat_salary"},
        headers=headers,
    )
    assert upd.status_code == 200 and upd.json()["amount"] == 15500.0 and upd.json()["title"] == "Salary Nov"

    assert client.delete(f"/api/transactions/{salary['id']}", headers=headers).status_code == 204
    assert client.get("/api/transactions", headers=headers).json()["total"] == 3


def test_transactions_are_private_between_users(client):
    """A user cannot see, edit or delete another user's personal transactions."""
    a = register(client, "a1@example.com")
    b = register(client, "b1@example.com")
    tx = client.post(
        "/api/transactions",
        json={"date": "2026-11-01", "title": "Mine", "amount": 10, "typeId": "type_expense", "categoryId": "cat_other_expense"},
        headers=a,
    ).json()
    assert client.get("/api/transactions", headers=b).json()["total"] == 0
    assert client.delete(f"/api/transactions/{tx['id']}", headers=b).status_code == 404

    bad_amount = client.post(
        "/api/transactions",
        json={"date": "2026-11-01", "title": "Zero", "amount": 0, "typeId": "type_expense", "categoryId": "cat_other_expense"},
        headers=a,
    )
    assert bad_amount.status_code == 422
