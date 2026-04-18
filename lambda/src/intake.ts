import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { respond } from './utils/cors'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))

// Resolve table name from the invoked alias (last segment of the function ARN).
// dev alias → TABLE_NAME_DEV, prod alias → TABLE_NAME_PROD
function resolveTableName(context: Context): string {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  return alias === 'prod'
    ? process.env.TABLE_NAME_PROD!
    : process.env.TABLE_NAME_DEV!
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']
  const TABLE_NAME = resolveTableName(context)

  try {
    if (!event.body) {
      return respond(400, { error: 'Missing request body' }, alias, requestOrigin)
    }

    const data = JSON.parse(event.body)

    if (!data.email) {
      return respond(400, { error: 'email is required' }, alias, requestOrigin)
    }

    const submissionId = randomUUID()
    const submittedAt = new Date().toISOString()

    await client.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        submissionId,
        email: data.email,
        submittedAt,
        ...data,
      },
    }))

    return respond(201, { submissionId, submittedAt }, alias, requestOrigin)
  } catch (err) {
    console.error('intake error', err)
    return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
  }
}
