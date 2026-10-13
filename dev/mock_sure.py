"""Mock Sure API with synthetic data, for developing Sovi without real financial data.

Serves the read endpoints Sovi uses (/api/v1/accounts, /transactions, /balances) with the same
shapes and sign conventions as the real Sure API. Requires header X-Api-Key: mockkey.
Run:  python dev/mock_sure.py [port]
"""
from __future__ import annotations

import io
import json
import random
import zipfile
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

KEY = "mockkey"
rng = random.Random(42)
TODAY = date.today()
DAYS = 120


def uid(name: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, "mock-sure/" + name))


ACCOUNTS = [
    # id-name, display, classification, account_type, subtype, opening balance, limit
    ("chk", "Everyday Checking", "asset", "depository", "checking", 4200.0, None),
    ("sav", "Rainy Day Savings", "asset", "depository", "savings", 12500.0, None),
    ("brk", "Index Brokerage", "asset", "investment", "brokerage", 31800.0, None),
    ("ira", "Roth IRA", "asset", "investment", "roth_ira", 18400.0, None),
    ("cc1", "Rewards Visa", "liability", "credit_card", "credit_card", 3150.0, 9000),
    ("cc2", "Store Card", "liability", "credit_card", "credit_card", 1840.0, 3000),
    ("cc3", "Travel Mastercard", "liability", "credit_card", "credit_card", 620.0, 12000),
    ("car", "Auto Loan", "liability", "loan", "auto", 14200.0, None),
]

CATS = {
    "Groceries": ("#34d399", ["Kroger", "Trader Joes", "Costco", "Aldi", "Whole Foods"], (35, 160)),
    "Dining": ("#f59e0b", ["Chipotle", "Local Pizzeria", "Starbucks", "Thai Orchid", "Taco Bell"], (9, 70)),
    "Transport": ("#60a5fa", ["Shell", "BP", "Uber", "Metro Transit"], (14, 70)),
    "Utilities": ("#a78bfa", ["City Power", "Water Dept", "Comcast"], (45, 140)),
    "Subscriptions": ("#f472b6", ["Netflix", "Spotify", "iCloud", "Gym Membership", "YouTube Premium"], (6, 45)),
    "Shopping": ("#fb7185", ["Amazon", "Target", "Home Depot", "Best Buy"], (15, 220)),
    "Health": ("#2dd4bf", ["CVS Pharmacy", "Dental Care", "Vision Center"], (12, 180)),
    "Entertainment": ("#c084fc", ["AMC Theatres", "Steam", "Ticketmaster"], (10, 120)),
}
SUBS = {"Netflix": 15.49, "Spotify": 11.99, "iCloud": 2.99, "Gym Membership": 39.0, "YouTube Premium": 13.99}


# APR, minimum payment and available credit / loan terms per liability, as Sure stores them
ACCOUNTABLE = {
    "cc1": ("CreditCard", {"apr": "24.99", "minimum_payment": "63.0", "available_credit": "5850.0", "annual_fee": None}),
    "cc2": ("CreditCard", {"apr": "29.99", "minimum_payment": "37.0", "available_credit": "1160.0", "annual_fee": None}),
    "cc3": ("CreditCard", {"apr": "19.24", "minimum_payment": "25.0", "available_credit": "11380.0", "annual_fee": "95.0"}),
    "car": ("Loan", {"interest_rate": "6.9", "term_months": 60, "start_date": "2024-03-01", "initial_balance": "21000.0", "rate_type": "fixed"}),
}


def export_zip() -> bytes:
    lines = []
    for a in ACCOUNTS:
        kind, acc = ACCOUNTABLE.get(a[0], ("Depository", {}))
        lines.append(json.dumps({"type": "Account", "data": {"id": uid(a[0]), "name": a[1], "accountable_type": kind, "accountable": acc}}))
    lines.append(json.dumps({"type": "Balance", "data": {}}))
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("version.txt", "2")
        z.writestr("all.ndjson", "\n".join(lines) + "\n")
    return buf.getvalue()


EXPORT_ID = str(uuid.uuid5(uuid.NAMESPACE_DNS, "mock-sure/export"))


def build():
    tx, bal = [], {a[0]: {} for a in ACCOUNTS}
    cards = ["cc1", "cc2", "cc3"]
    owed = {a[0]: a[5] for a in ACCOUNTS if a[2] == "liability"}
    cash = {a[0]: a[5] for a in ACCOUNTS if a[2] == "asset"}
    start = TODAY - timedelta(days=DAYS)

    def add(acct, d, name, merchant, cat, amount, transfer=False):
        # amount: negative = expense, positive = income (signed, like Sure's signed_amount_cents)
        tx.append({
            "id": uid(f"tx/{len(tx)}"), "date": d.isoformat(), "amount": f"${abs(amount):,.2f}",
            "amount_cents": abs(round(amount * 100)), "signed_amount_cents": round(amount * 100), "currency": "USD",
            "name": name, "notes": None, "external_id": None, "source": "simplefin", "user_modified": False,
            "classification": "expense" if amount < 0 else "income",
            "account": {"id": uid(acct), "name": next(a[1] for a in ACCOUNTS if a[0] == acct),
                        "account_type": next(a[3] for a in ACCOUNTS if a[0] == acct)},
            "category": ({"id": uid("cat/" + cat), "name": cat, "color": CATS[cat][0], "icon": "tag"} if cat and rng.random() < 0.35 else None),
            "merchant": {"id": uid("m/" + merchant), "name": merchant} if merchant else None,
            "tags": [], "transfer": ({"id": uid(f"tr/{len(tx)}"), "amount": f"${abs(amount):,.2f}", "currency": "USD", "other_account": {}} if transfer else None),
            "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat(),
        })

    for i in range(DAYS + 1):
        d = start + timedelta(days=i)
        if d.day in (1, 15) or (d.weekday() == 4 and d.day % 14 < 7 and False):
            pass
        if d.weekday() == 4 and (d - start).days // 7 % 2 == 0:  # biweekly payroll
            add("chk", d, "ACME CORP PAYROLL", "Acme Corp", None, 2850.0)
            cash["chk"] += 2850.0
        if d.day == 1:
            add("chk", d, "RENT", "Maple Apartments", None, -1650.0)
            cash["chk"] -= 1650.0
            add("car", d, "AUTO LOAN PAYMENT", None, None, 385.0, transfer=True)  # payment reduces owed
            add("chk", d, "AUTO LOAN PAYMENT", None, None, -385.0, transfer=True)
            owed["car"] -= 385.0 - 14200.0 * 0.068 / 12
            cash["chk"] -= 385.0
        for m, price in SUBS.items():
            if d.day == (hash(m) % 27) + 1:
                card = "cc1"
                add(card, d, m.upper(), m, "Subscriptions", -price)
                owed[card] += price
        # daily discretionary spend
        for _ in range(rng.choice([0, 1, 1, 2, 3])):
            cat = rng.choices(list(CATS), weights=[22, 18, 12, 4, 0, 18, 6, 8])[0]
            if cat == "Subscriptions":
                continue
            merchant = rng.choice(CATS[cat][1]); lo, hi = CATS[cat][2]
            amt = round(rng.uniform(lo, hi), 2)
            card = rng.choices(cards, weights=[6, 2, 3])[0]
            if rng.random() < 0.18:
                add("chk", d, merchant.upper(), merchant, cat, -amt); cash["chk"] -= amt
            else:
                add(card, d, merchant.upper(), merchant, cat, -amt); owed[card] += amt
        # card payments (transfers) mid-month
        if d.day == 20:
            for card in cards:
                pay = round(min(owed[card], max(60.0, owed[card] * rng.uniform(0.15, 0.5))), 2)
                add(card, d, "PAYMENT THANK YOU", None, None, pay, transfer=True)
                add("chk", d, f"CARD PAYMENT {card.upper()}", None, None, -pay, transfer=True)
                owed[card] -= pay; cash["chk"] -= pay
        # monthly interest on cards
        if d.day == 25:
            for card, apr in (("cc1", 0.2399), ("cc2", 0.2999), ("cc3", 0.1899)):
                interest = round(owed[card] * apr / 12, 2)
                add(card, d, "INTEREST CHARGE", "Card Issuer", None, -interest) if False else None
                owed[card] += interest
        for acct, *_ in ACCOUNTS:
            if acct in owed:
                bal[acct][d.isoformat()] = round(owed[acct], 2)
            elif acct == "chk":
                bal[acct][d.isoformat()] = round(cash["chk"], 2)
            else:
                growth = 1 + (0.0004 if acct in ("brk", "ira") else 0.0001)
                cash[acct] *= growth
                bal[acct][d.isoformat()] = round(cash[acct], 2)
    return tx, bal


TX, BAL = build()


def account_json(a):
    key, name, cls, atype, sub, _, limit = a
    b = BAL[key][TODAY.isoformat()]
    return {"id": uid(key), "name": name, "balance": f"${b:,.2f}", "balance_cents": round(b * 100),
            "cash_balance": f"${b:,.2f}", "cash_balance_cents": round(b * 100), "currency": "USD",
            "classification": cls, "account_type": atype, "subtype": sub, "status": "active",
            "institution_name": "Mock Bank", "institution_domain": "example.com",
            "created_at": "2026-06-01T00:00:00Z", "updated_at": datetime.now(timezone.utc).isoformat()}


def balances_json(a):
    key, name, cls, *_ = a
    out = []
    for d, b in BAL[key].items():
        out.append({"id": uid(f"bal/{key}/{d}"), "date": d, "currency": "USD", "flows_factor": -1 if cls == "liability" else 1,
                    "balance": f"${b:,.2f}", "balance_cents": round(b * 100),
                    "account": {"id": uid(key), "name": name},
                    "created_at": d + "T00:00:00Z", "updated_at": d + "T12:00:00Z"})
    return sorted(out, key=lambda r: r["date"], reverse=True)


def page(items, q):
    per = int(q.get("per_page", ["25"])[0]); pg = int(q.get("page", ["1"])[0])
    total = len(items)
    return items[(pg - 1) * per: pg * per], {"page": pg, "per_page": per, "total_count": total, "total_pages": max(1, -(-total // per))}


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):  # quiet
        pass

    def do_POST(self):
        if self.headers.get("X-Api-Key") != KEY:
            return self.send(401, {"error": "unauthorized"})
        if urlparse(self.path).path == "/api/v1/family_exports":
            return self.send(202, {"id": EXPORT_ID, "status": "pending", "downloadable": False})
        self.send(404, {"error": "not_found"})

    def do_GET(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        if u.path == "/files/export.zip":  # signed file URL: no API key, like Active Storage
            body = export_zip()
            self.send_response(200); self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Length", str(len(body))); self.end_headers(); return self.wfile.write(body)
        if self.headers.get("X-Api-Key") != KEY:
            return self.send(401, {"error": "unauthorized"})
        if u.path == f"/api/v1/family_exports/{EXPORT_ID}":
            return self.send(200, {"id": EXPORT_ID, "status": "completed", "downloadable": True})
        if u.path == f"/api/v1/family_exports/{EXPORT_ID}/download":
            self.send_response(302); self.send_header("Location", "/files/export.zip")
            self.send_header("Content-Length", "0"); self.end_headers(); return
        if u.path == "/api/v1/accounts":
            items, pg = page([account_json(a) for a in ACCOUNTS], q); return self.send(200, {"accounts": items, "pagination": pg})
        if u.path == "/api/v1/transactions":
            items = sorted(TX, key=lambda t: t["date"], reverse=True)
            if "start_date" in q: items = [t for t in items if t["date"] >= q["start_date"][0]]
            if "account_id" in q: items = [t for t in items if t["account"]["id"] == q["account_id"][0]]
            items, pg = page(items, q); return self.send(200, {"transactions": items, "pagination": pg})
        if u.path == "/api/v1/balances":
            aid = q.get("account_id", [None])[0]
            rows = [r for a in ACCOUNTS if aid in (None, uid(a[0])) for r in balances_json(a)]
            if "start_date" in q: rows = [r for r in rows if r["date"] >= q["start_date"][0]]
            items, pg = page(rows, q); return self.send(200, {"balances": items, "pagination": pg})
        self.send(404, {"error": "not_found"})

    def send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9000
    print(f"mock Sure on :{port} ({len(TX)} transactions, {len(ACCOUNTS)} accounts)")
    ThreadingHTTPServer(("0.0.0.0", port), H).serve_forever()
