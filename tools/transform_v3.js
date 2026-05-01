/**
 * transform_v3.js — multiply spendYTD and spendAllTime by 20, recalculate grossProfitAllTime
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/assets/data/vendors.json');
const vendors = JSON.parse(fs.readFileSync(filePath, 'utf8'));

for (const v of vendors) {
  if (v.spendYTD != null)    v.spendYTD    = Math.round(v.spendYTD    * 20);
  if (v.spendAllTime != null) v.spendAllTime = Math.round(v.spendAllTime * 20);
  v.grossProfitAllTime = v.spendAllTime != null
    ? Math.round(v.spendAllTime * v.marginPct / 100)
    : null;
}

fs.writeFileSync(filePath, JSON.stringify(vendors, null, 2));
console.log(`Done. Sample Active vendor:`, (() => {
  const v = vendors.find(x => x.contractStatus === 'Active' && x.spendYTD != null);
  return { name: v.name, spendYTD: v.spendYTD, spendAllTime: v.spendAllTime, grossProfitAllTime: v.grossProfitAllTime };
})());
