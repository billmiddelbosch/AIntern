# IssueResolver Lambda — Spec (I-07)

**Last Updated:** 2026-06-24

## Function Purpose

EventBridge-triggered Lambda that runs every 30 minutes. Queries the `aintern-loop` DynamoDB table for open and escalated issues, calls Claude Haiku to determine if each can be resolved automatically, then either reactivates the blocked action (status → `resolving`) or escalates to human (status → `escalated`). On unhandled handler failure, writes a `type: meta` ISSUE item so the admin UI surfaces the failure.

## Handler Name

`issueresolver.handler`

## Runtime

- Node.js 22.x
- Dependencies bundled by esbuild: `@anthropic-ai/sdk`
- AWS SDK v3 (`@aws-sdk/client-ssm`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`) — external (available in Node 22 runtime)

## Event Source

EventBridge scheduled rule: `aintern-issueresolver-schedule`
Schedule: `rate(30 minutes)`
Event type: `ScheduledEvent` (from `@types/aws-lambda`)
No HTTP trigger — no CORS handling required.

## Handler Signature

```typescript
export async function handler(_event: ScheduledEvent, context: Context): Promise<void>
```

## Environment Variables

| Variable | Source | Description |
|---|---|---|
| `LOOP_TABLE_NAME` | CDK `environment:` block | `aintern-loop` DynamoDB table name |

## SSM Parameters (read at cold start, cached)

| Parameter | Type | Description |
|---|---|---|
| `/aintern/{alias}/anthropic/api-key` | SecureString | Anthropic API key — fetched per alias (dev/prod) |

## IAM Permissions

| Action | Resource | Condition |
|---|---|---|
| `dynamodb:Query`, `dynamodb:GetItem`, `dynamodb:Scan` | `aintern-loop` table + GSI ARNs | via `grantReadData` |
| `dynamodb:UpdateItem`, `dynamodb:PutItem` | `aintern-loop` table | `ForAnyValue:StringLike: dynamodb:LeadingKeys: [ISSUE#*, ACTION#*]` |
| `ssm:GetParameter` | `/aintern/dev/anthropic/api-key`, `/aintern/prod/anthropic/api-key` | — |
| `kms:Decrypt` | `*` | `kms:ViaService = ssm.{region}.amazonaws.com` |

## DynamoDB Integration

**Table:** `aintern-loop` (single-table design)

**Read access patterns:**
- `Query GSI1 pk=STATUS#open FilterExpression begins_with(pk, 'ISSUE#')` — open issues
- `Query GSI1 pk=STATUS#escalated FilterExpression begins_with(pk, 'ISSUE#')` — escalated issues
- `GetItem ACTION#{actionRef} sk=META` — blocked action context
- `GetItem AGENT#{agentName} sk=CONFIG` — current agent instruction (via SDK `getAgentInstruction`)

**Write access patterns:**
- `UpdateItem ISSUE#{issueId} sk=META` — status → `resolving` or `escalated`, GSI1pk update
- `UpdateItem ACTION#{actionId} sk=META` — status → `open` (via SDK `updateActionStatus`)
- `PutItem ISSUE#{uuid} sk=META type=meta` — meta-issue on handler failure

**IssueResolver does NOT write to AGENT# items** — enforced by IAM condition and never attempted in code.

## Processing Loop

Max 50 issues per invocation (open + escalated combined).

Per issue:
1. GetItem blocked action for context
2. GetItem agent config instruction (read-only via SDK)
3. Call Claude Haiku (`claude-haiku-4-5-20251001`, max_tokens=512, temperature=0)
4. Parse JSON response; retry once on invalid JSON; skip if still invalid
5. If `solvableWithoutHuman=true`: mark ISSUE `resolving`, reactivate ACTION to `open`
6. If `solvableWithoutHuman=false`: mark ISSUE `escalated` (conditional — no-op if already escalated)

## Claude Haiku Call

- **Model:** `claude-haiku-4-5-20251001`
- **Max tokens:** 512
- **Temperature:** 0 (deterministic)
- System prompt instructs structured JSON response without markdown
- User message interpolates: agentName, currentInstruction, description, errorContext, actionType, actionPayload
- `instructionToAgent` and `payload` contents are never logged in full (PII risk)

## Error Handling

| Scenario | Behaviour |
|---|---|
| Haiku returns invalid JSON | Retry once; skip issue on second failure (`skipped` counter incremented) |
| `ConditionalCheckFailedException` on escalated update | Silent no-op (already escalated — idempotent) |
| Action not found for `actionRef` | Haiku called with `null` action context; processing continues |
| Unhandled handler-level error | Writes meta-issue to DynamoDB; meta-issue write failure logged to console only |

## Performance

- **Memory:** default (128 MB) — no memory-intensive operations
- **Timeout:** 300 seconds (50 issues × ~5s Haiku latency + DynamoDB overhead)
- **Concurrency:** single instance per schedule trigger; no parallel processing within handler
- **Cold start:** SSM key fetched once, cached for warm invocations

## Lambda Alias

- `prod` alias only (EventBridge targets the alias; no API Gateway stage routing)

## Monitoring

Structured JSON logs emitted via `console.log(JSON.stringify({...}))`:

| Event | Fields |
|---|---|
| Per-issue result | `level, fn=processIssue, issueId, agentName, result` |
| Haiku parse failure | `level=WARN, fn=processIssue, issueId, agentName, result=skipped, reason=haiku_invalid_json` |
| Run summary | `level=INFO, fn=handler, run, issues_processed, resolving, escalated, skipped` |
| Handler error | `level=ERROR, fn=handler, run, error` |
| Meta-issue write failure | `level=ERROR, fn=writeMetaIssue, error` |

CloudWatch Insights query for failures:
```
fields @timestamp, issueId, agentName, result, error
| filter fn = "processIssue" and result = "skipped"
| sort @timestamp desc
```

## Acceptance Criteria

- [ ] Open issues are queried from GSI1 pk=`STATUS#open` filtered to `ISSUE#*` items
- [ ] Escalated issues are queried from GSI1 pk=`STATUS#escalated` filtered to `ISSUE#*` items
- [ ] Combined issue list is capped at 50 per run
- [ ] Each issue is processed: Haiku called, response parsed
- [ ] Invalid JSON response triggers one retry; second failure → issue skipped, not crashed
- [ ] Solvable issue: ISSUE status updated to `resolving`, ACTION status updated to `open`
- [ ] Unsolvable issue: ISSUE status updated to `escalated` (ConditionalCheckFailed silently ignored)
- [ ] Handler failure writes a meta-issue with `type=meta`, `agentName=IssueResolver`
- [ ] Meta-issue write failure logs to console but does not re-throw
- [ ] Run summary log includes `issues_processed`, `resolving`, `escalated`, `skipped` counts
- [ ] `LOOP_TABLE_NAME` absence causes immediate error before any DDB calls
- [ ] AGENT# items are never written to (IAM-enforced + not attempted in code)
- [ ] No `payload` or `instructionToAgent` field contents logged in full
