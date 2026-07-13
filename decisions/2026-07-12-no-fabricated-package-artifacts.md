## Decision: Do not create `.iam-policy.json`, `.apigateway-model.json`, or `DEPLOYMENT.md` for the `/ask` endpoint
scope: project

## Context
The generic lambda-feature-builder pipeline's PACKAGE stage calls for a
per-handler `.iam-policy.json`, `.apigateway-model.json` (for API-triggered
handlers), and an authoritative `infra/DEPLOYMENT.md`, plus CDK
`NodejsFunction` with automatic esbuild-via-`cdk synth` bundling. None of
these artifacts or patterns exist anywhere in this repo today (confirmed by
search before starting this feature) — this project bundles manually via
`lambda/package.json` esbuild scripts (documented in `infra/CLAUDE.md`) and
has no `DEPLOYMENT.md`, no `.iam-policy.json`, and no `.apigateway-model.json`
files for any existing handler, including `/mcp`.

## Alternatives considered
1. Fabricate these files for `/ask` to satisfy the generic pipeline checklist
   (rejected).
2. Follow the project's actual, observed conventions and skip artifacts that
   don't exist elsewhere in the codebase (chosen).

## Reasoning
Root `CLAUDE.md` instructions override generic pipeline defaults. Inventing
a new per-project convention unilaterally (e.g. being the only handler with
an `.iam-policy.json`) would create inconsistency rather than resolve it, and
wasn't requested. `infra/CLAUDE.md` is the authoritative deployment reference
for this project and doesn't call for these files.

## Trade-offs accepted
No machine-readable IAM policy artifact or API Gateway request-model file
exists for `/ask` (or any other handler in this repo) for tooling/audit
purposes. Noted below as a backlog candidate rather than acted on
unilaterally — the task's closure instructions explicitly required deferring
backlog changes to the human/backlog-manager rather than editing the backlog
directly.

**Backlog candidate (not filed by this agent):** consider whether this
project wants a lightweight `DEPLOYMENT.md` and per-handler IAM policy
snapshots as a future consistency improvement across all handlers, not just
`/ask`.

## Supersedes
None.
