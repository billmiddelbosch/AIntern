# Infrastructure — Knowledge

## `AdminStack`'s Lambda code asset is shared across every function in the stack

`infra/lib/admin-stack.ts` defines one `lambdaCode = lambda.Code.fromAsset('../../lambda/dist')`
(line ~45) and passes the same `lambdaCode` reference as `code:` to every
`lambda.Function` in the stack (20+ functions, confirmed via grep 2026-07-12).

**Consequence:** rebundling *any single* handler (e.g. `npm run bundle:mcp-server`)
changes the hash of the entire `lambda/dist` directory, which CDK zips as one
asset. A `cdk diff` after rebundling one handler will show a new `Code.S3Key`
for **every** Lambda function in the stack, even ones whose source didn't
change — this is expected shared-asset behavior, not drift or a bug. Actual
runtime behavior of unrelated functions is unaffected (their `.js` files in
the zip are byte-identical), but `cdk deploy` will still publish a new
version + update the alias pointer for all of them.

**Implication for review:** when eyeballing a `cdk diff` after a single-handler
change, expect (and don't flag as suspicious) a `Code.S3Key` change plus a new
`Fn::GetAtt` version reference on every function's dev/prod `Alias` resources.
Focus review on the resource/method/stage/output diffs that are specific to
the actual feature.

scope: project
