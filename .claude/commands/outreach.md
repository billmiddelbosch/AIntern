---
name: outreach
description: "Process AIntern leads from a CSV file and send personalized LinkedIn connection requests. Reads leads from product/marketing/leads/, finds the right LinkedIn profile per company, asks for user approval, generates a Dutch outreach message, and logs results."
---

Use the `lead-outreach` agent to process LinkedIn outreach for AIntern leads.

$ARGUMENTS

If a CSV file path is provided in the arguments, use that file. Otherwise, use the most recent `.csv` file in `product/marketing/leads/`.

Start by reading the leads file, cross-referencing with `product/marketing/leads/outreach-log.csv` to determine which leads still need to be processed, and present a summary before proceeding.
