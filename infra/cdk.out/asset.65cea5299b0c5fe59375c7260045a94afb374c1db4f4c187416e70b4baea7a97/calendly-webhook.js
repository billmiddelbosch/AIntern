"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME;
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
};
const handler = async (event) => {
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
            // No matching submission — store the webhook data standalone
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
