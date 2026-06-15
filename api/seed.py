import asyncio
import datetime
import random
from app.config import settings
from app.auth.crypto import hash_password
import asyncpg

async def seed_data():
    print("Connecting to database...")
    # Read database DSN from settings
    dsn = settings.DATABASE_URL
    # asyncpg expects postgresql:// or postgres:// scheme
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://")
    
    conn = await asyncpg.connect(dsn)
    print("Connected successfully.")

    # 1. Create or get demo user
    email = "demo@example.com"
    password = "demopassword123"
    display_name = "Demo Admin"
    
    # Check if user exists
    user = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)
    if user:
        user_id = user["id"]
        print(f"User {email} already exists (ID: {user_id}). Seeding data for this user...")
    else:
        pw_hash = hash_password(password)
        user_id = await conn.fetchval(
            """
            INSERT INTO users (email, password_hash, display_name, is_admin, totp_enabled)
            VALUES ($1, $2, $3, true, false)
            RETURNING id
            """,
            email, pw_hash, display_name
        )
        print(f"Created demo user: {email} / {password} (ID: {user_id})")

    # 2. Clear existing data for this user to avoid conflicts
    print("Clearing old data for this user...")
    await conn.execute("DELETE FROM balance_snapshots WHERE user_id = $1", user_id)
    await conn.execute("DELETE FROM transactions WHERE user_id = $1", user_id)
    await conn.execute("DELETE FROM debt_metadata WHERE user_id = $1", user_id)
    await conn.execute("DELETE FROM accounts WHERE user_id = $1", user_id)
    await conn.execute("DELETE FROM categories WHERE user_id = $1", user_id)
    await conn.execute("DELETE FROM streaks WHERE user_id = $1", user_id)
    await conn.execute("DELETE FROM milestones WHERE user_id = $1", user_id)

    # 3. Create default categories
    print("Creating default categories...")
    categories = [
        {"name": "Income", "icon": "trending-up", "color": "#10B981"},
        {"name": "Housing", "icon": "home", "color": "#3B82F6"},
        {"name": "Groceries", "icon": "shopping-cart", "color": "#F59E0B"},
        {"name": "Dining Out", "icon": "coffee", "color": "#EF4444"},
        {"name": "Utilities", "icon": "zap", "color": "#8B5CF6"},
        {"name": "Transportation", "icon": "truck", "color": "#6366F1"},
        {"name": "Entertainment", "icon": "film", "color": "#EC4899"},
        {"name": "Shopping", "icon": "tag", "color": "#6B7280"},
    ]
    
    cat_map = {}
    for cat in categories:
        cat_id = await conn.fetchval(
            """
            INSERT INTO categories (user_id, name, icon, color)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            user_id, cat["name"], cat["icon"], cat["color"]
        )
        cat_map[cat["name"]] = cat_id

    # 4. Create accounts
    print("Creating accounts...")
    # Checking account
    checking_id = await conn.fetchval(
        """
        INSERT INTO accounts (user_id, name, type, currency, is_manual)
        VALUES ($1, 'Primary Checking', 'checking', 'USD', true)
        RETURNING id
        """
        , user_id
    )
    
    # Savings account
    savings_id = await conn.fetchval(
        """
        INSERT INTO accounts (user_id, name, type, currency, is_manual)
        VALUES ($1, 'High-Yield Savings', 'savings', 'USD', true)
        RETURNING id
        """
        , user_id
    )

    # Credit card account
    cc_id = await conn.fetchval(
        """
        INSERT INTO accounts (user_id, name, type, currency, is_manual, credit_limit)
        VALUES ($1, 'Travel Rewards Credit Card', 'credit_card', 'USD', true, 10000.00)
        RETURNING id
        """
        , user_id
    )
    
    # Add debt metadata for credit card
    await conn.execute(
        """
        INSERT INTO debt_metadata (account_id, user_id, apr, min_payment_type, min_payment_value, statement_due_day)
        VALUES ($1, $2, 18.5, 'fixed', 35.00, 15)
        """,
        cc_id, user_id
    )

    # 5. Generate 30 days of transaction history & balance snapshots
    print("Generating history...")
    now = datetime.datetime.now(datetime.timezone.utc)
    start_date = now - datetime.timedelta(days=30)
    
    # Track daily balances
    checking_bal = 3000.00
    savings_bal = 15000.00
    cc_bal = 0.00

    # Write initial balance snapshots at day 0
    await conn.execute(
        "INSERT INTO balance_snapshots (account_id, user_id, balance, balance_date, captured_at) VALUES ($1, $2, $3, $4, $4)",
        checking_id, user_id, checking_bal, start_date
    )
    await conn.execute(
        "INSERT INTO balance_snapshots (account_id, user_id, balance, balance_date, captured_at) VALUES ($1, $2, $3, $4, $4)",
        savings_id, user_id, savings_bal, start_date
    )
    await conn.execute(
        "INSERT INTO balance_snapshots (account_id, user_id, balance, balance_date, captured_at) VALUES ($1, $2, $3, $4, $4)",
        cc_id, user_id, cc_bal, start_date
    )

    txn_count = 0
    for day in range(1, 31):
        current_date = start_date + datetime.timedelta(days=day)
        
        # Check if salary day (every 14 days)
        if day in [5, 19]:
            salary_amt = 2500.00
            checking_bal += salary_amt
            txn_count += 1
            await conn.execute(
                """
                INSERT INTO transactions (user_id, account_id, sfin_txn_id, posted, amount, description, category_id, category_source)
                VALUES ($1, $2, $3, $4, $5, 'Employer Direct Deposit', $6, 'user')
                """,
                user_id, checking_id, f"tx_salary_{day}", current_date, salary_amt, cat_map["Income"]
            )
            
            # Put $500 in savings
            transfer_amt = 500.00
            checking_bal -= transfer_amt
            savings_bal += transfer_amt
            txn_count += 2
            await conn.execute(
                """
                INSERT INTO transactions (user_id, account_id, sfin_txn_id, posted, amount, description, category_id, category_source)
                VALUES ($1, $2, $3, $4, $5, 'Transfer to Savings', $6, 'user')
                """,
                user_id, checking_id, f"tx_tr_out_{day}", current_date, -transfer_amt, cat_map["Housing"]
            )
            await conn.execute(
                """
                INSERT INTO transactions (user_id, account_id, sfin_txn_id, posted, amount, description, category_id, category_source)
                VALUES ($1, $2, $3, $4, $5, 'Transfer from Checking', $6, 'user')
                """,
                user_id, savings_id, f"tx_tr_in_{day}", current_date, transfer_amt, cat_map["Housing"]
            )

        # Rent payment on day 1
        if day == 1:
            rent_amt = 1500.00
            checking_bal -= rent_amt
            txn_count += 1
            await conn.execute(
                """
                INSERT INTO transactions (user_id, account_id, sfin_txn_id, posted, amount, description, category_id, category_source)
                VALUES ($1, $2, $3, $4, $5, 'Monthly Rent Payment', $6, 'user')
                """,
                user_id, checking_id, "tx_rent", current_date, -rent_amt, cat_map["Housing"]
            )

        # Utilities on day 10
        if day == 10:
            util_amt = 135.50
            cc_bal -= util_amt  # Paid with credit card
            txn_count += 1
            await conn.execute(
                """
                INSERT INTO transactions (user_id, account_id, sfin_txn_id, posted, amount, description, category_id, category_source)
                VALUES ($1, $2, $3, $4, $5, 'Electric Utility Bill', $6, 'user')
                """,
                user_id, cc_id, "tx_utility", current_date, -util_amt, cat_map["Utilities"]
            )

        # Groceries weekly
        if day in [3, 10, 17, 24]:
            groc_amt = round(random.uniform(90, 160), 2)
            cc_bal -= groc_amt
            txn_count += 1
            await conn.execute(
                """
                INSERT INTO transactions (user_id, account_id, sfin_txn_id, posted, amount, description, category_id, category_source)
                VALUES ($1, $2, $3, $4, $5, 'Whole Foods Market', $6, 'user')
                """,
                user_id, cc_id, f"tx_groc_{day}", current_date, -groc_amt, cat_map["Groceries"]
            )

        # Dining out (random days)
        if random.random() < 0.4:
            dine_amt = round(random.uniform(15, 60), 2)
            cc_bal -= dine_amt
            txn_count += 1
            await conn.execute(
                """
                INSERT INTO transactions (user_id, account_id, sfin_txn_id, posted, amount, description, category_id, category_source)
                VALUES ($1, $2, $3, $4, $5, 'Local Restaurant/Cafe', $6, 'user')
                """,
                user_id, cc_id, f"tx_dine_{day}", current_date, -dine_amt, cat_map["Dining Out"]
            )

        # Shopping / Entertainment (random days)
        if random.random() < 0.25:
            shop_amt = round(random.uniform(10, 120), 2)
            cc_bal -= shop_amt
            txn_count += 1
            await conn.execute(
                """
                INSERT INTO transactions (user_id, account_id, sfin_txn_id, posted, amount, description, category_id, category_source)
                VALUES ($1, $2, $3, $4, $5, 'Online Retailer', $6, 'user')
                """,
                user_id, cc_id, f"tx_shop_{day}", current_date, -shop_amt, cat_map["Shopping"]
            )

        # Write daily balance snapshots
        await conn.execute(
            "INSERT INTO balance_snapshots (account_id, user_id, balance, balance_date, captured_at) VALUES ($1, $2, $3, $4, $4)",
            checking_id, user_id, checking_bal, current_date
        )
        await conn.execute(
            "INSERT INTO balance_snapshots (account_id, user_id, balance, balance_date, captured_at) VALUES ($1, $2, $3, $4, $4)",
            savings_id, user_id, savings_bal, current_date
        )
        await conn.execute(
            "INSERT INTO balance_snapshots (account_id, user_id, balance, balance_date, captured_at) VALUES ($1, $2, $3, $4, $4)",
            cc_id, user_id, cc_bal, current_date
        )

    # 6. Create initial gamification milestone
    await conn.execute(
        """
        INSERT INTO milestones (user_id, type, label, meta)
        VALUES ($1, $2, $3, $4::jsonb)
        """,
        user_id, 'financial_health', 'First Savings Goal Reached', '{"amount": 15000}'
    )

    await conn.close()
    print("--------------------------------------------------")
    print("Seeding complete! Admin user is populated with:")
    print(f" - Email: {email}")
    print(f" - Password: {password}")
    print(f" - Checking balance: ${checking_bal:,.2f}")
    print(f" - Savings balance: ${savings_bal:,.2f}")
    print(f" - Credit card balance: ${cc_bal:,.2f}")
    print(f" - Generated {txn_count} transactions and 90 balance snapshots.")
    print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(seed_data())
