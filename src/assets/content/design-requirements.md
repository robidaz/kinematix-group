# VendorVault — Design Requirements

**Document owner:** KineMatix Group, AI Solutions Engineering

**Status:** Initial release

**Last updated:** 4/30/2026

---

## 0. Disclaimer

VendorVault is a **proof of concept** formulated entirely by Zach Robida to demonstrate the ability to leverage AI-assisted development to rapidly create value-added tools — without sacrificing quality. The goal was to show that modern AI tooling can meaningfully compress the gap between idea and working product, while still producing something polished and purposeful. This entire application went from design to deployment in ~5 hours and cost ~$30 including token consumption and domain name.

This application was designed and built using the assistance of **Claude Opus 4.7**.

All vendor data is simulated for demonstration purposes — company names may be real, but all metrics, contract values, and performance scores are entirely **fabricated** and should not be interpreted as factual.

---

## 1. Initial Requirements

The VendorVault initiative was scoped from a series of internal interviews across Sales, Procurement, Solutions Architecture, and Account Management. The recurring needs that justified building a dedicated tool — rather than extending an existing one — are summarized below.

- **Single, authoritative vendor catalog.** Today our vendor data lives in spreadsheets, email threads, the CRM, and individual SA notebooks. We need one consolidated catalog with a consistent schema so any team member can answer the question *"who do we work with in space X?"* in under a minute.
- **Cost transparency at the vendor level.** Annual spend is visible in finance systems but not in any tool the front-line teams actually use during client conversations. Cost should be a first-class, surfaced field — not buried in procurement systems.
- **Reputation and performance signal.** A normalized reputation score (informed by internal sentiment, win rates, and partner satisfaction) helps SAs choose between two functionally similar vendors.
- **Contract lifecycle visibility.** Account leads need to see contract status (Active / Prospect / Under Review) and upcoming renewal dates without filing a procurement ticket.
- **Specialization-driven discovery.** Vendors should be tagged by what they actually *do* — "Cybersecurity," "Identity," "Cloud Storage," "Backup & Recovery" — so filtering can be done by business outcome rather than vendor name.
- **AI-assisted vendor matching.** Most internal users describe needs in plain English ("we need a mid-range storage vendor with strong compliance"). The system should translate that description into a structured filter automatically, eliminating manual click-through filtering.
- **Demo / portfolio fitness.** This first iteration is a demonstration of the product concept, not a production deployment. The data set is intentionally a mix of real partners and simulated entries; all metrics are fabricated for demonstration purposes.

---

## 2. Implementation Summary

Each requirement above is addressed in the application as follows.

### Single, authoritative vendor catalog

The application ships with a curated catalog of ~250 vendors stored in a local JSON asset (`vendors.json`), but in a production tool would pull from an API endpoint or database. Each entry conforms to a single schema covering identity, classification, financial, reputation, contract, and specialization fields. The catalog is rendered via a DataGrid with sortable columns, search, and column visibility controls so a user can shape the view to the question they're asking.

### Cost transparency

Cost is rendered as a 1–4 dollar-sign scale (`$` through `$$$$`) directly in the grid, in an amber/gold treatment that draws the eye. Annual spend in USD is a dedicated column and surfaces in the vendor detail dialog.

### Reputation and performance signal

Each vendor carries a numeric `reputation` score on a 0–5 scale, surfaced as a star-rating visual alongside the literal value. Sorting on this column lets a user immediately rank vendors within a filtered subset.

### Contract lifecycle visibility

Contract status is rendered as a colored badge — green (Active), blue (Prospect), amber (Under Review). Renewal date is a dedicated column formatted for human reading. Both fields are filterable through the AI prompt as well.

### Specialization-driven discovery

Specializations are stored as an array per vendor and rendered as Chips in the grid (with a "+N more" overflow label when a vendor carries many specializations). The AI matching layer reads specializations as a filterable input and matches user queries against them.

### AI-assisted vendor matching

The AI Prompt Panel above the grid accepts a free-text description of a client's need. On submit, the description is sent to Anthropic's Claude API along with a context summary of available vendor types and specializations. Claude returns a structured JSON filter object plus a one-line plain-English summary of what was filtered. The filter is applied to the grid's data source programmatically; the summary is rendered below the input. A pre-seeded AutoComplete dropdown gives users common starting prompts, and a Clear / Reset button restores the unfiltered view.

### Demo / portfolio fitness

A persistent disclaimer banner above the grid clarifies that vendor data is simulated. The application has no backend, no authentication, and no database — all data is loaded from local JSON, markdown, and text assets. The Anthropic API call is the only outbound HTTP call the application makes, and only on user-initiated submit.
