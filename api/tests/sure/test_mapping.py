"""Mapping tests use synthetic payloads in the shape Sure's API returns (no real data)."""
from datetime import timezone
from decimal import Decimal

from app.sure import mapping as m


def acct(**kw):
    base = {"id": "a1", "name": "Acct", "balance_cents": 123456, "currency": "USD", "classification": "asset",
            "account_type": "depository", "subtype": "checking", "institution_name": "Bank"}
    base.update(kw)
    return base


def test_credit_card_balance_is_stored_negative():
    row = m.account_row(acct(classification="liability", account_type="credit_card", subtype="credit_card", balance_cents=132281))
    assert row["type"] == "credit_card"
    assert row["balance"] == Decimal("-1322.81")


def test_asset_balance_stays_positive():
    assert m.account_row(acct())["balance"] == Decimal("1234.56")


def test_liability_already_negative_is_not_flipped_back():
    # defensive: whatever sign Sure sends, a liability is stored as a negative amount owed
    assert m.signed_balance(acct(classification="liability", balance_cents=-5000)) == Decimal("-50.00")


def test_account_types():
    assert m.account_type(acct(account_type="depository", subtype="savings")) == "savings"
    assert m.account_type(acct(account_type="depository", subtype="checking")) == "checking"
    assert m.account_type(acct(account_type="investment", subtype="roth_401k")) == "investment"
    assert m.account_type(acct(classification="liability", account_type="loan", subtype="mortgage")) == "loan"
    assert m.account_type(acct(account_type="property")) == "other"


def test_expense_is_negative_income_positive():
    exp = m.transaction_row({"id": "t1", "date": "2026-10-01", "signed_amount_cents": -4599, "classification": "expense",
                             "name": "COFFEE", "merchant": {"id": "m", "name": "Coffee Co"}, "category": None, "transfer": None})
    inc = m.transaction_row({"id": "t2", "date": "2026-10-02", "signed_amount_cents": 250000, "classification": "income",
                             "name": "PAYROLL", "merchant": None, "category": {"name": "Income"}, "transfer": None})
    assert exp["amount"] == Decimal("-45.99") and exp["merchant"] == "Coffee Co" and exp["ext_category"] is None
    assert inc["amount"] == Decimal("2500.00") and inc["ext_category"] == "Income"
    assert exp["posted"].tzinfo == timezone.utc


def test_transfer_flag():
    t = m.transaction_row({"id": "t3", "date": "2026-10-03", "signed_amount_cents": -10000, "name": "Move",
                           "merchant": None, "category": None, "transfer": {"id": "x", "other_account": {}}})
    assert t["is_transfer"] is True


def test_daily_balances_dedupes_by_day_latest_wins_and_signs_liabilities():
    rows = [
        {"date": "2026-10-01", "balance_cents": 10000, "updated_at": "2026-10-01T01:00:00Z"},
        {"date": "2026-10-01", "balance_cents": 12000, "updated_at": "2026-10-01T09:00:00Z"},
        {"date": "2026-10-02", "balance_cents": 9000, "updated_at": "2026-10-02T09:00:00Z"},
    ]
    out = m.daily_balances(rows, "liability")
    assert [b for _, b in out] == [Decimal("-120.00"), Decimal("-90.00")]
    assert [d.day for d, _ in out] == [1, 2]
    assert [b for _, b in m.daily_balances(rows, "asset")] == [Decimal("120.00"), Decimal("90.00")]
