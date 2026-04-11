---
name: CEO Delegation Protocol — dispatch terminals immediately on approval
description: After Human Board approves an action, dispatch the agent terminal in the same response — do not wait for the next message
type: feedback
---

Dispatch agent terminals immediately after receiving Human Board approval — not in a follow-up message.

**Why:** On 2026-04-11 the Human Board explicitly called this out: approved actions (B-01 security check, L-14 stap 1&2) were confirmed but terminals were not dispatched. The CEO role is to act on approvals in real-time, not to summarise and wait.

**How to apply:**
- When the Human Board responds with approvals at the End-of-Meeting Gate, the very same response must include the `claude -p "..."` Bash calls for all approved terminal actions
- Sequential rule still applies — dispatch Terminal 1, wait for ✅ summary, then dispatch Terminal 2 in the next turn
- Never end a turn with "I will dispatch Terminal X" without actually dispatching it

**One terminal = one backlog item. No sub-terminals.**

**Why:** On 2026-04-11 the L-14 terminal internally spawned sub-agents, opening additional windows the Human Board did not request. One `claude -p` call covers exactly one backlog item end-to-end. The prompt must explicitly instruct the agent: do not spawn sub-agents, do not open additional terminals — complete the work inline.

**How to apply:**
- Every terminal prompt must include the instruction: "Complete all steps inline — do not spawn sub-agents or additional terminals."
- If the backlog item is too large for one terminal, split it into smaller backlog items first and get Human Board approval before dispatching
