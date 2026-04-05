"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({}));
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
};
// Resolve table name from the invoked alias (last segment of the function ARN).
// dev alias → TABLE_NAME_DEV, prod alias → TABLE_NAME_PROD
function resolveTableName(context) {
    const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev';
    return alias === 'prod'
        ? process.env.TABLE_NAME_PROD
        : process.env.TABLE_NAME_DEV;
}
const handler = async (event, context) => {
    const TABLE_NAME = resolveTableName(context);
    try {
        if (!event.body) {
            return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing request body' }) };
        }
        const payload = JSON.parse(event.body);
        // Calendly invitee.created payload shape
        const invitee = payload?.payload?.invitee;
        const scheduledEvent = payload?.payload?.scheduled_event;
        if (!invitee?.email || !scheduledEvent?.start_time) {
            return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid Calendly payload' }) };
        }
        const email = invitee.email;
        const meetingTime = scheduledEvent.start_time;
        const meetingUri = scheduledEvent.uri ?? '';
        // Find the most recent submission for this email
        const result = await client.send(new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'email-submittedAt-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email },
            ScanIndexForward: false,
            Limit: 1,
        }));
        const submission = result.Items?.[0];
        if (!submission) {
            console.warn(`No intake submission found for email: ${email}`);
            return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ message: 'No matching submission found' }) };
        }
        await client.send(new lib_dynamodb_1.UpdateCommand({
            TableName: TABLE_NAME,
            Key: { submissionId: submission.submissionId },
            UpdateExpression: 'SET meetingTime = :meetingTime, meetingUri = :meetingUri, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':meetingTime': meetingTime,
                ':meetingUri': meetingUri,
                ':updatedAt': new Date().toISOString(),
            },
        }));
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ submissionId: submission.submissionId, meetingTime }),
        };
    }
    catch (err) {
        console.error('calendly-webhook error', err);
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};
exports.handler = handler;
