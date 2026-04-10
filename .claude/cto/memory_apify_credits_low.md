---
name: Apify credits nearly depleted
description: Apify account balance at ~$0.07 as of 2026-04-10 — insufficient to run Google Search scraper or other paid actors
type: project
---

As of 2026-04-10, the Apify account balance is approximately $0.07. This is below the minimum required to run paid actors such as `apify~google-search-scraper`. The `curious_coder~linkedin-profile-scraper` also fails, though that is due to the expired LI_AT cookie rather than credits.

**Impact:** Step 5 (new lead decision-maker lookup via Google Search) cannot run until credits are topped up.

**Action required:** Top-up at https://console.apify.com/billing/subscription

**Why:** The morning briefing outreach pipeline depends on Apify for both LinkedIn profile scraping and Google search. Without credits, the entire outreach automation is blocked.

**How to apply:** At the start of each morning briefing run, check for Apify credit errors. If a `not-enough-usage-to-run-paid-actor` error appears, immediately add it to the "Blocked / Action Required" section of the briefing email and skip dependent steps.
