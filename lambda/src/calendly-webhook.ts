import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

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

    const payload = JSON.parse(event.body)

    // Calendly invitee.created payload shape
    const invitee = payload?.payload?.invitee
    const scheduledEvent = payload?.payload?.scheduled_event

    if (!invitee?.email || !scheduledEvent?.start_time) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid Calendly payload' }) }
    }

    const email: string = invitee.email
    const meetingTime: string = scheduledEvent.start_time
    const meetingUri: string = scheduledEvent.uri ?? ''

    // Find the most recent submission for this email
    const result = await client.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'email-submittedAt-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
      ScanIndexForward: false,
      Limit: 1,
    }))

    const submission = result.Items?.[0]

    if (!submission) {
      console.warn(`No intake submission found for email: ${email}`)
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ message: 'No matching submission found' }) }
    }

    await client.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { submissionId: submission.submissionId },
      UpdateExpression: 'SET meetingTime = :meetingTime, meetingUri = :meetingUri, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':meetingTime': meetingTime,
        ':meetingUri': meetingUri,
        ':updatedAt': new Date().toISOString(),
      },
    }))

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ submissionId: submission.submissionId, meetingTime }),
    }
  } catch (err) {
    console.error('calendly-webhook error', err)
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}
