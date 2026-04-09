import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const ssm = new SSMClient({ region: 'eu-west-2' })

// JWT secret is cached at module level (changes rarely; re-fetched on cold start)
let cachedJwtSecret: string | null = null

function resolveAlias(context: Context): string {
  return context.invokedFunctionArn.split(':').pop() ?? 'dev'
}

// SSM parameter paths only allow [A-Za-z0-9.-_/].
// Encode email for use as a path segment: replace @ and any other invalid chars.
function emailToSsmKey(email: string): string {
  return email.replace('@', '_at_').replace(/[^A-Za-z0-9.\-_]/g, '_')
}

function corsOrigin(alias: string): string {
  return alias === 'prod' ? 'https://aintern.nl' : 'http://localhost:5173'
}

function respond(
  statusCode: number,
  body: unknown,
  alias: string,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': corsOrigin(alias),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  }
}

async function getJwtSecret(alias: string): Promise<string> {
  if (cachedJwtSecret) return cachedJwtSecret
  const path = `${process.env.JWT_SECRET_SSM_PREFIX}/${alias}`
  const result = await ssm.send(
    new GetParameterCommand({ Name: path, WithDecryption: true }),
  )
  const secret = result.Parameter?.Value
  if (!secret) throw new Error(`JWT secret not found at ${path}`)
  cachedJwtSecret = secret
  return secret
}

async function getPasswordHash(email: string): Promise<string | null> {
  const path = `${process.env.ADMIN_USERS_SSM_PREFIX}/${emailToSsmKey(email)}/password-hash`
  try {
    const result = await ssm.send(
      new GetParameterCommand({ Name: path, WithDecryption: true }),
    )
    return result.Parameter?.Value ?? null
  } catch (err: unknown) {
    const name = (err as { name?: string }).name
    if (name === 'ParameterNotFound') return null
    throw err
  }
}

async function handleLogin(
  body: Record<string, unknown>,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const { email, password } = body
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return respond(400, { error: 'email and password are required' }, alias)
  }

  const [hash, secret] = await Promise.all([
    getPasswordHash(email),
    getJwtSecret(alias),
  ])

  if (!hash) {
    return respond(401, { error: 'Invalid credentials' }, alias)
  }

  const valid = await bcrypt.compare(password, hash)
  if (!valid) {
    return respond(401, { error: 'Invalid credentials' }, alias)
  }

  const user = { id: email, name: email, email, role: 'admin' as const }
  const token = jwt.sign(
    { sub: email, name: email, email, role: 'admin' },
    secret,
    { algorithm: 'HS256', expiresIn: '8h' },
  )

  return respond(200, { token, user }, alias)
}

async function handleRegister(
  body: Record<string, unknown>,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const { email, password, name } = body
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof name !== 'string' ||
    !email || !password || !name
  ) {
    return respond(400, { error: 'email, password and name are required' }, alias)
  }

  if (password.length < 8) {
    return respond(400, { error: 'Password must be at least 8 characters' }, alias)
  }

  // First-run check: if a hash already exists for this email, registration is closed
  const existing = await getPasswordHash(email)
  if (existing !== null) {
    return respond(403, { error: 'Registration is closed' }, alias)
  }

  const hash = await bcrypt.hash(password, 12)
  const path = `${process.env.ADMIN_USERS_SSM_PREFIX}/${emailToSsmKey(email)}/password-hash`

  await ssm.send(
    new PutParameterCommand({
      Name: path,
      Value: hash,
      Type: 'SecureString',
      Overwrite: false,
    }),
  )

  return respond(201, { success: true }, alias)
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const alias = resolveAlias(context)

  let body: Record<string, unknown>
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return respond(400, { error: 'Invalid JSON body' }, alias)
  }

  try {
    if (event.resource === '/admin/login') {
      return await handleLogin(body, alias)
    }
    if (event.resource === '/admin/register') {
      return await handleRegister(body, alias)
    }
    return respond(404, { error: 'Not found' }, alias)
  } catch (err) {
    console.error('admin-auth error:', err)
    return respond(500, { error: 'Internal server error' }, alias)
  }
}
