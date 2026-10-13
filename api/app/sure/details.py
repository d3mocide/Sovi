"""Account details (APR, minimum payment, limits) from a Sure family export.

Sure's REST API leaves these out of /accounts, but the family export (all.ndjson) carries each
account with its full accountable record. Pure functions, no I/O.
"""
from __future__ import annotations

import io
import json
import zipfile
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

_MAX_NDJSON_BYTES = 1024 * 1024 * 1024  # uncompressed ceiling while streaming; zip-bomb guard
_CENT = Decimal("0.01")


def _dec(v: Any) -> Decimal | None:
    if v is None or v == "":
        return None
    try:
        return Decimal(str(v))
    except InvalidOperation:
        return None


def _date(v: Any) -> date | None:
    try:
        return date.fromisoformat(str(v)[:10]) if v else None
    except ValueError:
        return None


def _read_ndjson_lines(lines) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if not line[:40].replace(b" ", b"").startswith(b'{"type":"Account"'):
            break
        data = json.loads(line).get("data") or {}
        if data.get("id"):
            out[str(data["id"])] = data
    return out


def read_account_records(data: bytes) -> dict[str, dict[str, Any]]:
    """Return {sure account id: account record incl. 'accountable'} from a Sure family export.

    Takes the export zip or its all.ndjson on its own. Accounts are written first, so reading stops at
    the first other record type and the (much larger) transaction and balance lines are never parsed.
    """
    if data[:2] != b"PK":
        try:
            return _read_ndjson_lines(io.BytesIO(data))
        except ValueError:
            raise ValueError("that file is neither a Sure export zip nor an all.ndjson") from None
    try:
        z = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile:
        raise ValueError("the Sure export was not a valid zip file") from None
    with z:
        try:
            info = z.getinfo("all.ndjson")
        except KeyError:
            return {}
        if info.file_size > _MAX_NDJSON_BYTES:
            raise ValueError("all.ndjson is larger than Sovi will read")
        with z.open(info) as f:
            return _read_ndjson_lines(f)


def loan_payment(principal: Decimal, annual_rate_pct: Decimal, term_months: int) -> Decimal:
    """Level monthly payment of a fixed-rate loan."""
    if term_months <= 0:
        raise ValueError("term must be positive")
    r = annual_rate_pct / Decimal(1200)
    if r == 0:
        return (principal / term_months).quantize(_CENT)
    pay = principal * r / (1 - (1 + r) ** (-term_months))
    return pay.quantize(_CENT)


def debt_terms(record: dict[str, Any], balance_owed: Decimal) -> dict[str, Any] | None:
    """What Sure knows about one liability, as Sovi fields. Missing values are None (never guessed).

    balance_owed is the positive amount owed now. Returns None for accounts with no accountable data.
    """
    kind = (record.get("accountable_type") or "").lower()
    acc = record.get("accountable") or {}
    terms: dict[str, Any] = {"apr": None, "min_payment": None, "credit_limit": None,
                             "term_months": None, "opened_date": None, "original_principal": None,
                             "min_payment_derived": False}
    if kind == "creditcard":
        terms["apr"] = _dec(acc.get("apr"))
        mp = _dec(acc.get("minimum_payment"))
        terms["min_payment"] = mp if mp and mp > 0 else None
        avail = _dec(acc.get("available_credit"))
        if avail is not None and balance_owed + avail > 0:
            terms["credit_limit"] = (balance_owed + avail).quantize(_CENT)
    elif kind == "loan":
        terms["apr"] = _dec(acc.get("interest_rate"))
        n = acc.get("term_months")
        terms["term_months"] = int(n) if n else None
        terms["opened_date"] = _date(acc.get("start_date"))
        init = _dec(acc.get("initial_balance"))
        terms["original_principal"] = init if init and init > 0 else None
        if terms["apr"] is not None and terms["term_months"] and terms["original_principal"]:
            terms["min_payment"] = loan_payment(terms["original_principal"], terms["apr"], terms["term_months"])
            terms["min_payment_derived"] = True
    else:
        return None
    if all(terms[k] is None for k in ("apr", "min_payment", "credit_limit", "term_months")):
        return None
    return terms
