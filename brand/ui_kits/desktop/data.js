/* Fake Sovi data for the UI kits — realistic, calm numbers. */
(function () {
  window.SoviData = {
    user: { email: "alex@home.lan", name: "Alex" },
    host: { name: "sovi.home.lan", synced: "2 min ago" },
    summary: {
      debtFreeMonths: 14,
      debtFreeDate: "March 2027",
      totalDebt: 18240,
      interestSaved: 1284,
      paidThisYear: 9120,
      onTimeStreak: 7,
    },
    debts: [
      { id: "1", name: "Chase Sapphire", type: "credit_card", apr: 24.99, balance: 4820, progressPct: 38, payoffMonths: 11 },
      { id: "2", name: "Student Loan — Nelnet", type: "loan", apr: 5.5, balance: 9600, progressPct: 52, payoffMonths: 14 },
      { id: "3", name: "Auto Loan", type: "loan", apr: 6.9, balance: 3820, progressPct: 64, payoffMonths: 8 },
    ],
    accounts: [
      { id: "a1", name: "Everyday Checking", type: "checking", balance: 4210.55, isManual: false },
      { id: "a2", name: "Emergency Savings", type: "savings", balance: 8600.0, isManual: false },
      { id: "a3", name: "Chase Sapphire", type: "credit_card", balance: -4820.12, apr: 24.99, hasDebt: true },
      { id: "a4", name: "Student Loan — Nelnet", type: "loan", balance: -9600.0, apr: 5.5, hasDebt: true },
      { id: "a5", name: "Auto Loan", type: "loan", balance: -3820.0, apr: 6.9, hasDebt: true },
      { id: "a6", name: "Brokerage", type: "investment", balance: 12450.3, isManual: true, needsClass: true },
    ],
    // 90-day total-debt trend (descending = good)
    trend: [
      28100, 27600, 27200, 26500, 26100, 25400, 24950, 24300,
      23800, 23100, 22600, 21950, 21400, 20800, 20150, 19600, 18900, 18240,
    ],
    streaks: [
      { type: "On-time payments", count: 7, best: 12 },
      { type: "Daily syncs", count: 3, best: 9 },
      { type: "No new debt", count: 18, best: 18 },
    ],
    transactions: [
      { id: "t1", merchant: "Nelnet Payment", date: "Jun 12", amount: -340, account: "Student Loan", kind: "payment" },
      { id: "t2", merchant: "Chase Card Payment", date: "Jun 10", amount: -260, account: "Chase Sapphire", kind: "payment" },
      { id: "t3", merchant: "Whole Foods", date: "Jun 9", amount: -82.4, account: "Checking", kind: "spend" },
      { id: "t4", merchant: "Paycheck", date: "Jun 7", amount: 2480, account: "Checking", kind: "income" },
      { id: "t5", merchant: "Auto Loan", date: "Jun 5", amount: -190, account: "Auto Loan", kind: "payment" },
    ],
  };
})();
