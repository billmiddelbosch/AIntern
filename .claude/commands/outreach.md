---
name: outreach
description: "Run the AIntern LinkedIn outreach workflow. Finds leads, identifies the right person on LinkedIn, and drafts the outreach message with their LinkedIn URL. Human sends manually. Supports two modes: 'connections' (Step 1 — draft connection messages for new leads) and 'dms' (Step 2 — draft icebreaker DMs for accepted connections). Defaults to connections mode."
---

Use the `linkedin-outreach` agent to prepare LinkedIn outreach for AIntern.

$ARGUMENTS

**Mode selection:**
- `/outreach connections` — process new leads and draft connection messages (Step 1)
- `/outreach dms` — draft icebreaker DMs for accepted connections (Step 2)
- `/outreach` (no argument) — defaults to connections mode

If a CSV file path is provided, use that file. Otherwise, use the most recent `.csv` in `product/marketing/leads/`.

The agent will find the right LinkedIn profile, draft the message, and show you the LinkedIn URL to open. You send manually.
