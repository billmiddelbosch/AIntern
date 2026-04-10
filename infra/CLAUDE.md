# CLAUDE.md — AIntern Infrastructure

## Lambda Build Convention

All Lambda handlers are bundled with **esbuild**, not plain `tsc`.

### Why esbuild
- Third-party packages (e.g. `bcryptjs`, `jsonwebtoken`) must be inlined into the output
  bundle — they are not available in the Lambda Node.js 22 runtime.
- esbuild produces a single self-contained `.js` file per handler, which CDK zips and uploads.
- The AWS SDK v3 (`@aws-sdk/*`) **is** available in the Node 22 runtime and is always marked
  `--external` to keep bundle sizes small.

### Build commands (lambda/package.json)

```bash
# Build all handlers
cd lambda && npm run build

# Build individual handlers
npm run bundle:intake
npm run bundle:calendly
npm run bundle:admin-auth
```

### Adding a new handler

1. Create `lambda/src/<name>.ts`
2. Add a bundle script to `lambda/package.json`:
   ```json
   "bundle:<name>": "esbuild src/<name>.ts --bundle --platform=node --target=node22 --outfile=dist/<name>.js --external:@aws-sdk/*"
   ```
3. Add `&& npm run bundle:<name>` to the `build` script
4. Reference in CDK: `handler: '<name>.handler'`

### tsconfig.json
`lambda/tsconfig.json` is kept for **IDE type checking only** — it is not used during the
build. Do not run `tsc` as part of the build pipeline.

## Stacks

| Stack | File | Description |
|---|---|---|
| `AInternKennisbankStack` | `lib/kennisbank-stack.ts` | Public S3 bucket for Kennisbank content |
| `AInternIntakeStack` | `lib/intake-stack.ts` | Intake API Gateway → Lambda → DynamoDB |
| `AInternAdminStack` | `lib/admin-stack.ts` | Admin auth API Gateway → Lambda + SSM |

## Region
All stacks deploy to `eu-west-2` (London).

## Dev/Prod pattern
Every Lambda has `dev` and `prod` aliases. API Gateway stage variables (`alias: 'dev'` / `'prod'`)
route each stage to the correct alias. The handler resolves its alias via:

```typescript
const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
```

## SSM Parameters (AdminStack)

| Parameter | Type | Description |
|---|---|---|
| `/aintern/admin/jwt-secret/dev` | SecureString | JWT signing secret for dev |
| `/aintern/admin/jwt-secret/prod` | SecureString | JWT signing secret for prod |
| `/aintern/admin/users/<email>/password-hash` | SecureString | bcrypt hash (cost 12) |

Create JWT secrets manually before deploying:
```bash
aws ssm put-parameter --name /aintern/admin/jwt-secret/dev --value "<32+ random bytes base64>" --type SecureString --region eu-west-2
aws ssm put-parameter --name /aintern/admin/jwt-secret/prod --value "<different secret>" --type SecureString --region eu-west-2
```

Password hash is created via the frontend `/admin/register` page (first-run, single use).
