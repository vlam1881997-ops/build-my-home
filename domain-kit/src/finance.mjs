import { number, integer } from './validation.mjs';

// VND nguyên. Lãi suất dùng số thập phân: 0.069 = 6.9%/năm.
// Mô hình tháng, giải ngân toàn bộ tại đầu kỳ; chưa mô phỏng lãi theo ngày.
export function loanSchedule({ principal, months, method = 'annuity', ratePeriods }) {
  integer(principal, 'principal'); integer(months, 'months', 1, 600);
  if (!['annuity', 'equal_principal'].includes(method)) throw new Error('INVALID_METHOD');
  if (!Array.isArray(ratePeriods) || !ratePeriods.length) throw new Error('MISSING_RATE');
  let previous = 0;
  for (const p of ratePeriods) {
    integer(p.fromMonth, 'fromMonth', 1, months); number(p.annualRate, 'annualRate', 0, 1);
    if (p.fromMonth <= previous) throw new Error('RATE_PERIOD_ORDER');
    previous = p.fromMonth;
  }
  if (ratePeriods[0].fromMonth !== 1) throw new Error('RATE_START_MUST_BE_1');
  let balance = principal, periodIndex = 0, payment = 0;
  const rows = [];
  for (let month = 1; month <= months; month++) {
    if (ratePeriods[periodIndex + 1]?.fromMonth === month) periodIndex++;
    const period = ratePeriods[periodIndex], r = period.annualRate / 12;
    if (period.fromMonth === month) {
      const remaining = months - month + 1;
      payment = r === 0 ? balance / remaining : balance * r / (1 - Math.pow(1 + r, -remaining));
    }
    const interest = Math.round(balance * r);
    const principalPaid = month === months ? balance : Math.min(balance, Math.max(0,
      Math.round(method === 'equal_principal' ? principal / months : payment - interest)));
    const openingBalance = balance;
    balance -= principalPaid;
    rows.push({ month, openingBalance, annualRate: period.annualRate,
      principalPaid, interest, payment: principalPaid + interest, closingBalance: balance });
  }
  return rows;
}

export function financialSummary({ cash, emergencyReserve, committedLoan = 0,
  netMonthlyIncome, grossMonthlyIncome = null, livingCosts, existingMonthlyDebt = 0 }, schedule = []) {
  for (const [k, v] of Object.entries({ cash, emergencyReserve, committedLoan, netMonthlyIncome, livingCosts, existingMonthlyDebt })) integer(v, k);
  if (emergencyReserve > cash) throw new Error('RESERVE_EXCEEDS_CASH');
  if (grossMonthlyIncome !== null) integer(grossMonthlyIncome, 'grossMonthlyIncome');
  for (const row of schedule) integer(row.payment, 'payment');
  const peakPayment = Math.max(0, ...schedule.map(row => row.payment));
  const debt = peakPayment + existingMonthlyDebt;
  return { availableCapital: cash - emergencyReserve + committedLoan,
    peakPayment, peakNetDebtRatio: netMonthlyIncome > 0 ? debt / netMonthlyIncome : null,
    peakGrossDTI: grossMonthlyIncome > 0 ? debt / grossMonthlyIncome : null,
    monthlyRemainderAtPeak: netMonthlyIncome - livingCosts - debt,
    incomeMissing: netMonthlyIncome === 0 };
}

// Dòng tiền thực: vốn vay chỉ vào tháng thực giải ngân. Không cộng hạn mức vay vào số dư đầu.
export function cashflow({ openingCash, emergencyReserve = 0, months }) {
  integer(openingCash, 'openingCash'); integer(emergencyReserve, 'emergencyReserve');
  if (!Array.isArray(months)) throw new Error('INVALID_MONTHS');
  let balance = openingCash;
  return months.map((row, i) => {
    const r = { income: 0, loanDraw: 0, livingCosts: 0, existingDebt: 0, loanPayment: 0, construction: 0, ...row };
    for (const k of ['income','loanDraw','livingCosts','existingDebt','loanPayment','construction']) integer(r[k], k);
    const openingBalance = balance;
    balance += r.income + r.loanDraw - r.livingCosts - r.existingDebt - r.loanPayment - r.construction;
    return { ...r, month: i + 1, openingBalance, closingBalance: balance,
      reserveGap: Math.max(0, emergencyReserve - balance), cashShortfall: Math.max(0, -balance) };
  });
}
