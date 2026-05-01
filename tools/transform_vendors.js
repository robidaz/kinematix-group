/**
 * One-time transform: adds spendYTD (renamed from annualSpend), spendAllTime,
 * dealsClosedYTD, dealsClosedAllTime, and testimonials to each vendor entry.
 * Prospects receive null for all metrics. Run once, then delete or archive.
 */
const fs = require('fs');
const path = require('path');

const vendorsPath = path.join(__dirname, '../src/assets/data/vendors.json');
const employees = require('../src/assets/data/employees.json');
const vendors = JSON.parse(fs.readFileSync(vendorsPath, 'utf8'));

// Seeded PRNG so output is deterministic per vendor
function makePrng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return h;
}

const feedbackBank = [
  "Excellent partner for enterprise engagements. Responsive team and frictionless proof-of-concept process.",
  "Solid technical integration story — our engineers had the connector running in under a day. Documentation is well-maintained.",
  "Strong compliance posture was a key differentiator in a financial services deal. Helped us close faster than expected.",
  "Pricing has crept up at each renewal cycle. Worth monitoring contract terms before auto-renewing.",
  "Support SLAs are consistently met. When we escalated, their senior team engaged within the hour.",
  "Good fit for mid-market clients. Enterprise feature breadth may exceed smaller clients' needs.",
  "Used this vendor on two consecutive engagements. Second deployment was noticeably smoother — they incorporate feedback well.",
  "Onboarding was heavier than the project scope required, but post-go-live performance has been rock solid.",
  "Client specifically requested this vendor based on a prior relationship. Renewal was straightforward.",
  "Partner portal and deal registration need improvement, but underlying product quality more than compensates.",
  "Demo environment was polished and ready to go. Saved significant SA prep time during the evaluation.",
  "Their professional services team stepped in proactively when we hit an integration snag. No extra charge.",
];

const transformed = vendors.map((vendor) => {
  const rng = makePrng(hashStr(vendor.id));
  const isProspect = vendor.contractStatus === 'Prospect';

  // Rename annualSpend → spendYTD; null out for prospects
  const spendYTD = isProspect ? null : vendor.annualSpend;

  let spendAllTime = null;
  let dealsClosedYTD = null;
  let dealsClosedAllTime = null;
  let testimonials = [];

  if (!isProspect) {
    const multiplier = 2 + Math.round(rng() * 4);         // 2–6x YTD
    spendAllTime = Math.round(vendor.annualSpend * multiplier / 1000) * 1000;

    const base = vendor.annualSpend < 50000 ? 2
                : vendor.annualSpend < 200000 ? 6
                : vendor.annualSpend < 500000 ? 12
                : 20;
    dealsClosedYTD = Math.max(1, Math.round(base + (rng() - 0.5) * base));
    dealsClosedAllTime = Math.round(dealsClosedYTD * (3 + rng() * 5));

    // ~65% of non-prospect vendors get 1–3 testimonials
    if (rng() < 0.65) {
      const count = 1 + Math.floor(rng() * 3);
      const usedFeedback = new Set();
      const usedEmployee = new Set();
      for (let i = 0; i < count; i++) {
        let fi, ei;
        let attempts = 0;
        do { fi = Math.floor(rng() * feedbackBank.length); } while (usedFeedback.has(fi) && attempts++ < 10);
        attempts = 0;
        do { ei = Math.floor(rng() * employees.length); } while (usedEmployee.has(ei) && attempts++ < 10);
        usedFeedback.add(fi);
        usedEmployee.add(ei);
        testimonials.push({
          feedback: feedbackBank[fi],
          employeeName: employees[ei].name,
          employeeRole: employees[ei].role,
        });
      }
    }
  }

  const { annualSpend, ...rest } = vendor;
  return {
    ...rest,
    spendYTD,
    spendAllTime,
    dealsClosedYTD,
    dealsClosedAllTime,
    testimonials,
  };
});

fs.writeFileSync(vendorsPath, JSON.stringify(transformed, null, 2));
console.log(`Transformed ${transformed.length} vendors.`);
const withTestimonials = transformed.filter(v => v.testimonials.length > 0).length;
const prospects = transformed.filter(v => v.contractStatus === 'Prospect').length;
console.log(`Prospects (null metrics): ${prospects}`);
console.log(`Vendors with testimonials: ${withTestimonials}`);
