---
name: outreach
description: "Run the AIntern LinkedIn outreach workflow. Processes leads from product/marketing/leads/, sends connection requests and icebreaker DMs via Bill's personal LinkedIn account. Always requires explicit approval before sending. Supports two modes: 'connections' (Step 1 — send connection requests to new leads) and 'dms' (Step 2 — send icebreaker DMs to accepted connections). Defaults to connections mode."
---

Use the `linkedin-outreach` agent to run LinkedIn outreach for AIntern.

$ARGUMENTS

**Mode selection:**
- `/outreach connections` — process new leads and send connection requests (Step 1)
- `/outreach dms` — follow up with accepted connections and send icebreaker DMs (Step 2)
- `/outreach` (no argument) — defaults to connections mode

If a CSV file path is provided, use that file. Otherwise, use the most recent `.csv` in `product/marketing/leads/`.

The agent will always show an approval screen before sending anything and enforces the 10 connections/day rate limit.
