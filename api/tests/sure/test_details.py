import asyncio
import io
import json
import zipfile
from decimal import Decimal

import httpx
import pytest

from app.sure.client import SureAuthError, SureClient, SureError, SureExportForbidden
from app.sure.details import debt_terms, loan_payment, read_account_records


def make_zip(lines, ndjson="all.ndjson"):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr(ndjson, "\n".join(json.dumps(x) for x in lines) + "\n")
    return buf.getvalue()


CARD = {"type": "Account", "data": {"id": "c1", "accountable_type": "CreditCard", "accountable": {
    "apr": "24.99", "minimum_payment": "63.0", "available_credit": "5850.0"}}}
LOAN = {"type": "Account", "data": {"id": "l1", "accountable_type": "Loan", "accountable": {
    "interest_rate": "6.9", "term_months": 60, "start_date": "2024-03-01", "initial_balance": "21000.0"}}}
SAVINGS = {"type": "Account", "data": {"id": "s1", "accountable_type": "Depository", "accountable": {}}}


def test_reads_only_account_lines_and_stops_at_the_first_other_record():
    z = make_zip([CARD, LOAN, SAVINGS, {"type": "Balance", "data": {}}, {"type": "Account", "data": {"id": "late"}}])
    assert set(read_account_records(z)) == {"c1", "l1", "s1"}


def test_zip_without_ndjson_is_empty():
    assert read_account_records(make_zip([CARD], ndjson="other.txt")) == {}


def test_credit_card_terms_and_limit_from_available_credit():
    t = debt_terms(CARD["data"], Decimal("3150"))
    assert t["apr"] == Decimal("24.99")
    assert t["min_payment"] == Decimal("63.0")
    assert t["credit_limit"] == Decimal("9000.00")
    assert t["min_payment_derived"] is False


def test_loan_terms_and_derived_payment():
    t = debt_terms(LOAN["data"], Decimal("14200"))
    assert t["apr"] == Decimal("6.9") and t["term_months"] == 60
    assert str(t["opened_date"]) == "2024-03-01"
    assert t["min_payment"] == loan_payment(Decimal("21000"), Decimal("6.9"), 60)
    assert Decimal("410") < t["min_payment"] < Decimal("420")
    assert t["min_payment_derived"] is True


def test_zero_rate_loan_payment_is_straight_line():
    assert loan_payment(Decimal("1200"), Decimal("0"), 12) == Decimal("100.00")


def test_missing_values_are_none_not_guessed():
    t = debt_terms({"accountable_type": "CreditCard", "accountable": {"apr": "19.9"}}, Decimal("100"))
    assert t["apr"] == Decimal("19.9")
    assert t["min_payment"] is None and t["credit_limit"] is None


def test_nothing_known_or_other_type_gives_none():
    assert debt_terms({"accountable_type": "CreditCard", "accountable": {}}, Decimal("1")) is None
    assert debt_terms(SAVINGS["data"], Decimal("1")) is None


def run(coro):
    return asyncio.run(coro)


def test_download_follows_redirect_without_sending_the_api_key():
    seen = []

    def handler(req: httpx.Request):
        seen.append((req.url.host, req.headers.get("x-api-key")))
        if req.url.path.endswith("/download"):
            return httpx.Response(302, headers={"location": "https://files.example.net/blob/abc?sig=1"})
        return httpx.Response(200, content=b"PK\x03\x04data")

    async def go():
        c = SureClient("http://sure.test", "KEY123", transport=httpx.MockTransport(handler))
        try:
            return await c.download_export("e1")
        finally:
            await c.aclose()

    assert run(go()) == b"PK\x03\x04data"
    assert seen[0] == ("sure.test", "KEY123")
    assert seen[1] == ("files.example.net", None)


def test_download_refuses_oversized_file():
    def handler(req):
        return httpx.Response(200, content=b"x" * 100)

    async def go():
        c = SureClient("http://sure.test", "KEY123", transport=httpx.MockTransport(handler))
        try:
            await c.download_export("e1", max_bytes=10)
        finally:
            await c.aclose()

    with pytest.raises(SureError):
        run(go())


def test_create_export_forbidden_has_its_own_error_and_no_key():
    async def go():
        c = SureClient("http://sure.test", "KEY123", transport=httpx.MockTransport(lambda r: httpx.Response(403, json={})))
        try:
            await c.create_export()
        finally:
            await c.aclose()

    with pytest.raises(SureExportForbidden) as e:
        run(go())
    assert "KEY123" not in str(e.value)


def test_create_export_returns_id():
    async def go():
        c = SureClient("http://sure.test", "K", transport=httpx.MockTransport(lambda r: httpx.Response(202, json={"data": {"id": "e9", "status": "pending"}})))
        try:
            return await c.create_export()
        finally:
            await c.aclose()

    assert run(go()) == "e9"


def test_export_status_is_unwrapped_from_data():
    async def go():
        c = SureClient("http://sure.test", "K", transport=httpx.MockTransport(
            lambda r: httpx.Response(200, json={"data": {"id": "e9", "status": "completed", "downloadable": True}})))
        try:
            return await c.export_status("e9")
        finally:
            await c.aclose()

    assert run(go())["downloadable"] is True


def test_create_export_without_id_is_a_clear_error():
    async def go():
        c = SureClient("http://sure.test", "K", transport=httpx.MockTransport(lambda r: httpx.Response(202, json={"data": {}})))
        try:
            await c.create_export()
        finally:
            await c.aclose()

    with pytest.raises(SureError):
        run(go())


def test_non_zip_download_is_reported_with_where_it_came_from():
    def handler(req):
        if req.url.path.endswith("/download"):
            return httpx.Response(302, headers={"location": "https://sure.test/login?x=secret"})
        return httpx.Response(200, headers={"content-type": "text/html"}, content=b"<html>sign in</html>")

    async def go():
        c = SureClient("http://sure.test", "KEY123", transport=httpx.MockTransport(handler))
        try:
            await c.download_export("e1")
        finally:
            await c.aclose()

    with pytest.raises(SureError) as e:
        run(go())
    msg = str(e.value)
    assert "text/html" in msg and "https://sure.test/login" in msg
    assert "secret" not in msg and "KEY123" not in msg and "sign in" not in msg


def test_bad_zip_bytes_become_a_value_error():
    with pytest.raises(ValueError):
        read_account_records(b"not a zip")
