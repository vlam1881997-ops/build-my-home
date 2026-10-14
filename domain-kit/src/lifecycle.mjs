import { number, integer, text } from './validation.mjs';
// Kịch bản đầu vào, không phải dự báo tuổi thọ thật. Không cộng gốc vay lần hai vào LCC.
export function lifecycle({ initialCost, annualOperatingCost, annualMaintenanceCost,
  inflationRate = 0, discountRate = 0, repairs = [], years = 10 }) {
  for(const [k,v] of Object.entries({initialCost,annualOperatingCost,annualMaintenanceCost})) integer(v,k);
  number(inflationRate,'inflationRate',0,1); number(discountRate,'discountRate',0,1); integer(years,'years',1,100);
  for(const r of repairs){integer(r.year,'repair.year',1,years);integer(r.cost,'repair.cost');text(r.assumption,'repair.assumption');}
  let nominalTotal=initialCost, presentValue=initialCost;
  const rows=[];
  for(let year=1;year<=years;year++) {
    const factor=(1+inflationRate)**(year-1);
    const operations=Math.round(annualOperatingCost*factor), maintenance=Math.round(annualMaintenanceCost*factor);
    const repair=Math.round(repairs.filter(r=>r.year===year).reduce((s,r)=>s+r.cost,0)*factor);
    const total=operations+maintenance+repair;
    nominalTotal+=total; presentValue+=total/(1+discountRate)**year;
    rows.push({year,operations,maintenance,repair,total,cumulative:nominalTotal});
  }
  return {kind:'illustrative_scenario',rows,nominalTotal,presentValue:Math.round(presentValue), excludes:['loan_principal','loan_interest','resale_value']};
}
