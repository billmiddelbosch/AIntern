---
name: Recurring Weekly Tasks
description: Standing weekly obligations the CEO must ensure get done — content and LinkedIn cadence
type: project
---

Two recurring tasks must happen every week without exception:

1. **Kennisbank article** — One new Dutch article published to the AIntern kennisbank (aintern.nl/kennisbank). Delegate to CMO. CMO knows the full publish workflow (S3 upload via AWS CLI). Topics should target Lightspeed webshop owners — time savings, automation, MKB praktijkcases.

2. **LinkedIn company page update** — At least one post on the AIntern LinkedIn company page. Delegate to CMO. CMO can post directly via the Zapier MCP LinkedIn integration.

**Why:** Consistent content output builds SEO authority for the kennisbank and keeps the LinkedIn audience warm for outreach campaigns. Gaps in cadence directly hurt lead generation.

**How to apply:** At the start of each session, check when the last article was published (`aws s3 cp s3://aintern-kennisbank/index.json -`) and when the last LinkedIn post went out. If either is overdue, instruct the CMO to handle it before moving to other work.
