import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import * as path from 'path'

export class IntakeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ── DynamoDB ────────────────────────────────────────────────────────────
    const intakeTable = new dynamodb.Table(this, 'IntakeTable', {
      tableName: 'aintern-intake-submissions',
      partitionKey: { name: 'submissionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    intakeTable.addGlobalSecondaryIndex({
      indexName: 'email-submittedAt-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    // ── Lambda functions ────────────────────────────────────────────────────
    // Code is built from lambda/src into lambda/dist before deploying
    const lambdaCode = lambda.Code.fromAsset(path.resolve(__dirname, '../../lambda/dist'))

    const commonProps: Omit<lambda.FunctionProps, 'handler' | 'functionName' | 'description'> = {
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: intakeTable.tableName,
      },
    }

    const intakeFn = new lambda.Function(this, 'IntakeFunction', {
      ...commonProps,
      functionName: 'aintern-intake',
      handler: 'intake.handler',
      description: 'Stores 5-step intake questionnaire results in DynamoDB',
    })

    const calendlyFn = new lambda.Function(this, 'CalendlyWebhookFunction', {
      ...commonProps,
      functionName: 'aintern-calendly-webhook',
      handler: 'calendly-webhook.handler',
      description: 'Processes Calendly invitee.created webhooks and links meeting time to DynamoDB',
    })

    // Grant DynamoDB access (PutItem, UpdateItem, Query)
    intakeTable.grantWriteData(intakeFn)
    intakeTable.grant(intakeFn, 'dynamodb:Query')
    intakeTable.grantWriteData(calendlyFn)
    intakeTable.grant(calendlyFn, 'dynamodb:Query')

    // ── API Gateway ─────────────────────────────────────────────────────────
    const api = new apigateway.RestApi(this, 'AInternIntakeApi', {
      restApiName: 'aintern-intake-api',
      description: 'AIntern intake questionnaire and Calendly webhook API',
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://aintern.nl', 'https://www.aintern.nl', 'http://localhost:5173'],
        allowMethods: ['POST', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
      },
      deployOptions: {
        stageName: 'prod',
      },
    })

    const intakeResource = api.root.addResource('intake')
    intakeResource.addMethod('POST', new apigateway.LambdaIntegration(intakeFn))

    const webhookResource = api.root.addResource('calendly-webhook')
    webhookResource.addMethod('POST', new apigateway.LambdaIntegration(calendlyFn))

    // ── Outputs ─────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'IntakeApiUrl', {
      value: `${api.url}intake`,
      description: 'POST /intake endpoint — use as VITE_API_BASE_URL',
      exportName: 'aintern-intake-api-url',
    })

    new cdk.CfnOutput(this, 'CalendlyWebhookUrl', {
      value: `${api.url}calendly-webhook`,
      description: 'POST /calendly-webhook endpoint for Calendly',
      exportName: 'aintern-calendly-webhook-url',
    })

    new cdk.CfnOutput(this, 'TableName', {
      value: intakeTable.tableName,
      description: 'DynamoDB table name for intake submissions',
      exportName: 'aintern-intake-table-name',
    })

    cdk.Tags.of(this).add('Project', 'aintern')
    cdk.Tags.of(this).add('ManagedBy', 'cdk')
    cdk.Tags.of(this).add('Feature', 'intake')
  }
}
