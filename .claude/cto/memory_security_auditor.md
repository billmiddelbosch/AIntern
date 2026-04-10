---
name: security-auditor agent
description: Security audit agent available to the CTO for reviewing AIntern code before deployment or after sensitive changes
type: reference
---

A dedicated **security-auditor** agent is available at `.claude/agents/security-auditor.md`.

**When to use it:**
- Before deploying any Lambda function that handles user input or credentials
- After touching `src/lib/axios.ts`, auth composables, or LinkedIn/Apify token handling
- When a Vue component introduces `v-html`, dynamic rendering, or external URL redirects
- On-demand security reviews of CDK stacks (IAM roles, S3 bucket policies, DynamoDB encryption)

**How to invoke it:**
Use the Agent tool with `subagent_type: "security-auditor"` and pass the file paths or feature scope to review.

**Output format:**
The agent returns a structured report with severity-graded findings (CRITICAL / HIGH / MEDIUM / LOW) and a one-line `Overall Risk` rating. Include this rating in your task summary to the CEO.

**Hook coverage:**
A PreToolUse hook (`security_reminder_hook.py`) runs automatically before every Edit/Write operation and blocks execution if it detects dangerous patterns (eval, innerHTML, exec, hardcoded secrets). This is the first layer; the security-auditor agent is the second, deeper layer.
