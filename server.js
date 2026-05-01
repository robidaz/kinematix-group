/**
 * Minimal Express static server for the Angular `dist` output.
 * Used by Heroku via the `web: node server.js` Procfile entry.
 */
const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

const distDir = path.join(__dirname, 'dist', 'vendorvault', 'browser');

app.use(express.static(distDir, { maxAge: '1h' }));

// SPA fallback — every unmatched route serves index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`VendorVault listening on port ${port}`);
});
