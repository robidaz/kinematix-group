/**
 * Minimal Express static server for the Angular `dist` output.
 * Used by Heroku via the `web: node server.js` Procfile entry.
 */
const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

const distDir = path.join(__dirname, 'dist', 'vendorvault', 'browser');

// Config endpoints — read secrets from Heroku Config Vars, never from the repo
app.get('/api/config/syncfusion-key', (_req, res) => {
  res.type('text').send(process.env.SYNCFUSION_KEY || '');
});

app.get('/api/config/anthropic-key', (_req, res) => {
  res.type('text').send(process.env.ANTHROPIC_KEY || '');
});

app.use(express.static(distDir, { maxAge: '1h' }));

// SPA fallback — every unmatched route serves index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`VendorVault listening on port ${port}`);
});
