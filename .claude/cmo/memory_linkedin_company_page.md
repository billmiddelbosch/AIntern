---
name: LinkedIn Company Page Publishing
description: How to post company updates to the AIntern LinkedIn company page via Zapier MCP
type: reference
---

AIntern's LinkedIn company page can be posted to directly using the Zapier MCP tool `mcp__claude_ai_Zapier__linkedin_create_company_update`.

**Company:** AIntern (company_id: 112602084) — this is fixed/locked in Zapier, no need to specify it.

**Tool:** `mcp__claude_ai_Zapier__linkedin_create_company_update`
- `comment` — the post body text
- `title` — optional preview title (for link posts)
- `description` — optional preview description (for link posts)
- `submitted_url` — optional media/link URL
- `image` — optional image
- `instructions` — required, natural language instruction to Zapier
- `output_hint` — required, describes what data to return from the result

**Workflow:**
1. Draft the post copy (in Dutch, pain-first, real numbers, soft CTA)
2. Show the draft to Bill for approval
3. Only publish after explicit approval using the Zapier MCP tool

**Example confirmed working post:** urn:li:share:7447713428330303488 (published 2026-04-08)
