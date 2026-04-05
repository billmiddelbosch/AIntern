import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

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
  const TABLE_NAME = resolveTableName(context)

  try {
    if (!event.body) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing request body' }) }
    }

    const data = JSON.parse(event.body)

    if (!data.email) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'email is required' }) }
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

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({ submissionId, submittedAt }),
    }
  } catch (err) {
    console.error('intake error', err)
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}
