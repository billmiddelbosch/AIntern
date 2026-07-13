# Knowledge Index

Routes to domain knowledge for the AIntern Lambda/CDK infrastructure. See also
`infra/CLAUDE.md` for the authoritative build/stack conventions (esbuild bundling,
stack list, region, SSM parameters) — not duplicated here.

| Domain | Contents |
|---|---|
| [lambda-patterns](lambda-patterns/knowledge.md) | Multi-route-per-Lambda dispatch pattern; test-isolation pattern for module-level caches |
| [infrastructure](infrastructure/knowledge.md) | Shared CDK asset behavior (`Code.fromAsset('lambda/dist')`) |

See `/decisions/` for dated cross-cutting decisions.
