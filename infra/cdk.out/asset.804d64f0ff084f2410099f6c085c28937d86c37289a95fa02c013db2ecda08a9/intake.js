"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
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
        const data = JSON.parse(event.body);
        if (!data.email) {
            return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'email is required' }) };
        }
        const submissionId = (0, crypto_1.randomUUID)();
        const submittedAt = new Date().toISOString();
        await client.send(new lib_dynamodb_1.PutCommand({
            TableName: TABLE_NAME,
            Item: {
                submissionId,
                email: data.email,
                submittedAt,
                ...data,
            },
        }));
        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({ submissionId, submittedAt }),
        };
    }
    catch (err) {
        console.error('intake error', err);
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};
exports.handler = handler;
