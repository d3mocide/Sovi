from decimal import Decimal
from app.payoff.types import Debt

THREE_DEBT_FIXTURE = [
    Debt(id="card-a", balance=Decimal("3000"), apr=Decimal("22.99"),
         min_payment_type="percent", min_payment_value=Decimal("2"),
         min_payment_floor=Decimal("36")),
    Debt(id="card-b", balance=Decimal("1200"), apr=Decimal("18.99"),
         min_payment_type="fixed", min_payment_value=Decimal("35")),
    Debt(id="loan-c", balance=Decimal("8500"), apr=Decimal("9.99"),
         min_payment_type="fixed", min_payment_value=Decimal("175")),
]
