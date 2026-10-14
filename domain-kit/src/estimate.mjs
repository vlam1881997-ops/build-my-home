import { number, integer, text } from './validation.mjs';

// Đầu vào là khối lượng đã được xác nhận, KHÔNG tự suy khối lượng kết cấu từ ảnh.
// Một dòng = một nguồn giá, đơn vị tương thích, giá chưa thuế.
export function estimate({ lines, contingencyRate = 0, availableCapital = 0 }) {
  number(contingencyRate, 'contingencyRate', 0, 1); integer(availableCapital, 'availableCapital');
  if (!Array.isArray(lines) || !lines.length) throw new Error('EMPTY_ESTIMATE');
  const ids = new Set();
  const items = lines.map(line => {
    text(line.id, 'id'); text(line.description, 'description');
    if (ids.has(line.id)) throw new Error('DUPLICATE_LINE'); ids.add(line.id);
    if (line.quantityConfirmed !== true) throw new Error('UNCONFIRMED_QUANTITY');
    if (!line.unit || line.unit !== line.priceUnit) throw new Error('UNIT_MISMATCH');
    number(line.quantity, 'quantity'); integer(line.unitPrice, 'unitPrice');
    number(line.wasteRate ?? 0, 'wasteRate', 0, 1); number(line.taxRate ?? 0, 'taxRate', 0, 1);
    text(line.priceSource, 'priceSource');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(line.priceDate ?? '') || Number.isNaN(Date.parse(line.priceDate))) throw new Error('PRICE_DATE_REQUIRED');
    const quantityWithWaste = line.quantity * (1 + (line.wasteRate ?? 0));
    const net = Math.round(quantityWithWaste * line.unitPrice);
    integer(net, 'lineAmount');
    const tax = Math.round(net * (line.taxRate ?? 0));
    return { ...line, quantityWithWaste, net, tax, total: net + tax };
  });
  const baseTotal = items.reduce((sum, row) => sum + row.total, 0);
  integer(baseTotal, 'baseTotal');
  const constructionContingency = Math.round(baseTotal * contingencyRate);
  const total = baseTotal + constructionContingency;
  return { items, baseTotal, constructionContingency, total,
    budgetGap: availableCapital - total, includesEmergencyReserve: false };
}

export function milestonePlan(total, milestones) {
  integer(total, 'total');
  if (!Array.isArray(milestones) || !milestones.length) throw new Error('MISSING_MILESTONES');
  const ids = new Set();
  for (const m of milestones) {
    text(m.id, 'milestone.id');
    if(ids.has(m.id)) throw new Error('DUPLICATE_MILESTONE'); ids.add(m.id);
    integer(m.basisPoints, 'basisPoints', 0, 10000);
  }
  if (milestones.reduce((sum, m) => sum + m.basisPoints, 0) !== 10000) throw new Error('MILESTONES_MUST_SUM_100_PERCENT');
  let cumulative = 0, allocated = 0;
  return milestones.map(m => {
    cumulative += m.basisPoints;
    const target = Math.round(total * cumulative / 10000), amount = target - allocated;
    allocated = target;
    return { ...m, amount };
  });
}
