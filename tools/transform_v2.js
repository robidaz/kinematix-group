/**
 * transform_v2.js
 * - Rename 'Under Review' -> 'Inactive' (null renewalDate)
 * - Rename 'Prospect'    -> 'Under Review' (renewalDate = 'TBD')
 * - Add marginPct (6–20%, seeded per vendor)
 * - Add grossProfitAllTime = round(spendAllTime * marginPct / 100), or null
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/assets/data/vendors.json');
const vendors = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function hashStr(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return h || 1;
}

function lcg(seed) {
  return (seed * 16807) % 2147483647;
}

for (const v of vendors) {
  // Status & renewal date renames
  if (v.contractStatus === 'Under Review') {
    v.contractStatus = 'Inactive';
    v.renewalDate = null;
  } else if (v.contractStatus === 'Prospect') {
    v.contractStatus = 'Under Review';
    v.renewalDate = 'TBD';
  }

  // Deterministic margin % per vendor (6–20)
  let s = hashStr(v.id + '_margin');
  s = lcg(s);
  v.marginPct = 6 + (s % 15);

  // Gross profit all-time (null for vendors without spend data)
  v.grossProfitAllTime = v.spendAllTime != null
    ? Math.round(v.spendAllTime * v.marginPct / 100)
    : null;
}

fs.writeFileSync(filePath, JSON.stringify(vendors, null, 2));
console.log(`Done. Updated ${vendors.length} vendors.`);
const statuses = vendors.reduce((a, x) => { a[x.contractStatus] = (a[x.contractStatus] || 0) + 1; return a; }, {});
console.log('Status counts:', statuses);
