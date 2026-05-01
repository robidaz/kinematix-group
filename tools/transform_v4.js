/**
 * transform_v4.js
 * - Rescale spendYTD    to [400K, 8M],  rounded to nearest 50K
 * - Rescale spendAllTime to [750K, 20M], rounded to nearest 100K
 * - Recalculate grossProfitAllTime
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/assets/data/vendors.json');
const vendors = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const active = vendors.filter(v => v.spendYTD != null);

const ytdMin  = Math.min(...active.map(v => v.spendYTD));
const ytdMax  = Math.max(...active.map(v => v.spendYTD));
const allMin  = Math.min(...active.map(v => v.spendAllTime));
const allMax  = Math.max(...active.map(v => v.spendAllTime));

const TARGET_YTD_MIN  = 400_000,  TARGET_YTD_MAX  = 8_000_000;
const TARGET_ALL_MIN  = 750_000,  TARGET_ALL_MAX  = 20_000_000;

function rescale(val, oldMin, oldMax, newMin, newMax) {
  return newMin + ((val - oldMin) / (oldMax - oldMin)) * (newMax - newMin);
}

function roundTo(val, nearest) {
  return Math.round(val / nearest) * nearest;
}

for (const v of vendors) {
  if (v.spendYTD == null) continue;

  v.spendYTD    = roundTo(rescale(v.spendYTD,    ytdMin, ytdMax, TARGET_YTD_MIN, TARGET_YTD_MAX),  50_000);
  v.spendAllTime = roundTo(rescale(v.spendAllTime, allMin, allMax, TARGET_ALL_MIN, TARGET_ALL_MAX), 100_000);

  // Ensure all-time >= YTD
  if (v.spendAllTime < v.spendYTD) v.spendAllTime = v.spendYTD + 100_000;

  v.grossProfitAllTime = Math.round(v.spendAllTime * v.marginPct / 100);
}

fs.writeFileSync(filePath, JSON.stringify(vendors, null, 2));

const updated = vendors.filter(v => v.spendYTD != null);
const ytd  = updated.map(v => v.spendYTD).sort((a,b)=>a-b);
const all  = updated.map(v => v.spendAllTime).sort((a,b)=>a-b);
console.log(`spendYTD     min: $${(ytd[0]/1e6).toFixed(2)}M  max: $${(ytd[ytd.length-1]/1e6).toFixed(2)}M`);
console.log(`spendAllTime min: $${(all[0]/1e6).toFixed(2)}M  max: $${(all[all.length-1]/1e6).toFixed(2)}M`);
console.log('Done.');
