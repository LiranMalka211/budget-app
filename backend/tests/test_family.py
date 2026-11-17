from tests.conftest import register


def _tx(client, headers, title="Groceries", amount=100.0, type_id="type_expense", category_id="cat_groceries"):
    """Creates a transaction for the given user."""
    res = client.post(
        "/api/transactions",
        json={"date": "2026-11-10", "title": title, "amount": amount, "typeId": type_id, "categoryId": category_id},
        headers=headers,
    )
    assert res.status_code == 201, res.text
    return res.json()


def test_full_family_lifecycle(client):
    """Create -> join (pending) -> approve -> shared data -> head cannot leave -> remove member."""
    head = register(client, "head@example.com", "Dana", "Cohen")
    member = register(client, "member@example.com", "Yossi", "Cohen")

    assert client.get("/api/families/me", headers=head).json() is None

    # Personal transaction created before the family exists moves into it.
    _tx(client, head, "Before family")
    created = client.post("/api/families", json={"name": "Cohen family"}, headers=head)
    assert created.status_code == 201
    key = created.json()["inviteKey"]
    assert len(key) == 9

    joined = client.post("/api/families/join", json={"inviteKey": key.lower()}, headers=member)
    assert joined.status_code == 200 and joined.json()["status"] == "pending"

    pending_view = client.get("/api/families/me", headers=member).json()
    assert pending_view["myStatus"] == "pending"
    assert pending_view["family"]["inviteKey"] == ""
    assert pending_view["members"] == []

    head_view = client.get("/api/families/me", headers=head).json()
    assert head_view["isHead"] is True
    assert [p["user"]["email"] for p in head_view["pending"]] == ["member@example.com"]
    member_id = head_view["pending"][0]["userId"]

    # A pending member sees only their own (empty) personal budget.
    assert client.get("/api/transactions", headers=member).json()["total"] == 0

    assert client.post(f"/api/families/members/{member_id}/approve", headers=head).status_code == 204
    approved_view = client.get("/api/families/me", headers=member).json()
    assert approved_view["myStatus"] == "approved"
    assert len(approved_view["members"]) == 2
    assert client.get("/api/auth/me", headers=member).json()["familyId"] == created.json()["id"]

    # Shared scope: the member sees the head's earlier transaction and vice versa.
    assert client.get("/api/transactions", headers=member).json()["total"] == 1
    _tx(client, member, "Member purchase")
    titles = {t["title"] for t in client.get("/api/transactions", headers=head).json()["items"]}
    assert titles == {"Before family", "Member purchase"}

    leave = client.post("/api/families/leave", headers=head)
    assert leave.status_code == 409 and leave.json()["code"] == "head_cannot_leave"

    assert client.delete(f"/api/families/members/{member_id}", headers=head).status_code == 204
    assert client.get("/api/families/me", headers=member).json() is None
    assert client.get("/api/auth/me", headers=member).json()["familyId"] is None
    # Removed member's transactions stay in the family budget.
    assert client.get("/api/transactions", headers=head).json()["total"] == 2

    # Now alone, the head can leave, which dissolves the family.
    assert client.post("/api/families/leave", headers=head).status_code == 204
    assert client.get("/api/families/me", headers=head).json() is None


def test_join_errors_and_key_regeneration(client):
    """Unknown keys 404, double membership 409, and regenerating a key invalidates the old one."""
    head = register(client, "h2@example.com")
    other = register(client, "o2@example.com")
    bad = client.post("/api/families/join", json={"inviteKey": "NOPE-0000"}, headers=other)
    assert bad.status_code == 404 and bad.json()["code"] == "key_not_found"

    key = client.post("/api/families", json={"name": "F"}, headers=head).json()["inviteKey"]
    again = client.post("/api/families", json={"name": "G"}, headers=head)
    assert again.status_code == 409 and again.json()["code"] == "already_in_family"

    new_key = client.post("/api/families/regenerate-key", headers=head).json()["inviteKey"]
    assert new_key != key
    assert client.post("/api/families/join", json={"inviteKey": key}, headers=other).status_code == 404
    assert client.post("/api/families/join", json={"inviteKey": new_key}, headers=other).status_code == 200

    # Non-head cannot approve.
    assert client.post("/api/families/members/whoever/approve", headers=other).status_code == 403


def test_member_edit_permission(client):
    """Members read and add by default; editing and deleting need the head's permission. The head always edits."""
    head = register(client, "perm-head@example.com", "Dana", "Cohen")
    member = register(client, "perm-member@example.com", "Yossi", "Cohen")
    key = client.post("/api/families", json={"name": "Perm family"}, headers=head).json()["inviteKey"]
    client.post("/api/families/join", json={"inviteKey": key}, headers=member)
    member_id = client.get("/api/families/me", headers=head).json()["pending"][0]["userId"]
    client.post(f"/api/families/members/{member_id}/approve", headers=head)

    assert client.get("/api/families/me", headers=head).json()["canEdit"] is True
    assert client.get("/api/families/me", headers=member).json()["canEdit"] is False

    # Read and add: allowed.
    own = _tx(client, member, "Member row")
    heads_row = _tx(client, head, "Head row")
    assert client.get("/api/transactions", headers=member).json()["total"] == 2
    body = {"date": "2026-11-10", "title": "Changed", "amount": 1, "typeId": "type_expense", "categoryId": "cat_groceries"}

    # Edit, delete (even their own row) and schedule changes: refused.
    for res in (
        client.put(f"/api/transactions/{own['id']}", json=body, headers=member),
        client.delete(f"/api/transactions/{heads_row['id']}", headers=member),
    ):
        assert res.status_code == 403 and res.json()["code"] == "edit_not_allowed"
    sched = client.post(
        "/api/scheduled-transactions",
        json={"title": "Gym", "amount": 200, "typeId": "type_expense", "categoryId": "cat_health",
              "interval": "monthly", "dayOfMonth": 1, "startDate": "2030-01-01"},
        headers=member,
    )
    assert sched.status_code == 201, sched.text
    assert client.delete(f"/api/scheduled-transactions/{sched.json()['id']}", headers=member).status_code == 403

    # Only the head decides, and not about themselves.
    assert client.put(f"/api/families/members/{member_id}/permissions", json={"canEdit": True}, headers=member).status_code == 403
    head_id = client.get("/api/auth/me", headers=head).json()["id"]
    assert client.put(f"/api/families/members/{head_id}/permissions", json={"canEdit": False}, headers=head).status_code == 409
    assert client.put(f"/api/families/members/{member_id}/permissions", json={"canEdit": True}, headers=head).status_code == 204

    member_row = next(m for m in client.get("/api/families/me", headers=head).json()["members"] if m["userId"] == member_id)
    assert member_row["canEdit"] is True
    assert client.put(f"/api/transactions/{own['id']}", json=body, headers=member).status_code == 200
    assert client.delete(f"/api/transactions/{heads_row['id']}", headers=member).status_code == 204

    # Revoked again.
    client.put(f"/api/families/members/{member_id}/permissions", json={"canEdit": False}, headers=head)
    assert client.put(f"/api/transactions/{own['id']}", json=body, headers=member).status_code == 403
