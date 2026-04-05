import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import * as path from 'path'

export class IntakeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ── DynamoDB — separate table per environment ────────────────────────────
    const tableBase = {
      partitionKey: { name: 'submissionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    }
    const gsiProps: dynamodb.GlobalSecondaryIndexProps = {
      indexName: 'email-submittedAt-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    }

    const devTable = new dynamodb.Table(this, 'IntakeTableDev', {
      ...tableBase,
      tableName: 'aintern-intake-submissions-dev',
    })
    devTable.addGlobalSecondaryIndex(gsiProps)

    const prodTable = new dynamodb.Table(this, 'IntakeTableProd', {
      ...tableBase,
      tableName: 'aintern-intake-submissions-prod',
    })
    prodTable.addGlobalSecondaryIndex(gsiProps)

    // ── Lambda functions ─────────────────────────────────────────────────────
    // Both table names are available as env vars.
    // The handler picks the right one by reading the alias from context.invokedFunctionArn.
    const lambdaCode = lambda.Code.fromAsset(path.resolve(__dirname, '../../lambda/dist'))

    const makeFn = (id: string, functionName: string, handler: string, description: string) => {
      const fn = new lambda.Function(this, id, {
        functionName,
        handler,
        description,
        runtime: lambda.Runtime.NODEJS_22_X,
        code: lambdaCode,
        timeout: cdk.Duration.seconds(10),
        environment: {
          TABLE_NAME_DEV: devTable.tableName,
          TABLE_NAME_PROD: prodTable.tableName,
        },
      })
      devTable.grantWriteData(fn)
      devTable.grant(fn, 'dynamodb:Query')
      prodTable.grantWriteData(fn)
      prodTable.grant(fn, 'dynamodb:Query')
      return fn
    }

    const intakeFn = makeFn('IntakeFunction', 'aintern-intake', 'intake.handler', 'Stores intake questionnaire results in DynamoDB')
    const calendlyFn = makeFn('CalendlyWebhookFunction', 'aintern-calendly-webhook', 'calendly-webhook.handler', 'Processes Calendly invitee.created webhooks')

    // ── Lambda aliases ───────────────────────────────────────────────────────
    // dev  → $LATEST via currentVersion (always gets latest code on deploy)
    // prod → same version initially; promote by pointing prod alias to a specific version
    const intakeDevAlias = intakeFn.addAlias('dev')
    const intakeProdAlias = intakeFn.addAlias('prod')
    const calendlyDevAlias = calendlyFn.addAlias('dev')
    const calendlyProdAlias = calendlyFn.addAlias('prod')

    // ── API Gateway ──────────────────────────────────────────────────────────
    // Stage variable `alias` (dev | prod) is appended to the Lambda ARN so each
    // stage invokes the matching alias → matching DynamoDB table.
    const api = new apigateway.RestApi(this, 'AInternIntakeApi', {
      restApiName: 'aintern-intake-api',
      description: 'AIntern intake questionnaire and Calendly webhook API',
      deploy: false, // manual deployment so we can attach two stages
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://aintern.nl', 'https://www.aintern.nl', 'http://localhost:5173'],
        allowMethods: ['POST', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
      },
    })

    // Integration using ${stageVariables.alias} so each stage routes to its alias
    const aliasIntegration = (fn: lambda.Function) =>
      new apigateway.Integration({
        type: apigateway.IntegrationType.AWS_PROXY,
        integrationHttpMethod: 'POST',
        uri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${fn.functionArn}:\${stageVariables.alias}/invocations`,
      })

    api.root.addResource('intake').addMethod('POST', aliasIntegration(intakeFn))
    api.root.addResource('calendly-webhook').addMethod('POST', aliasIntegration(calendlyFn))

    // Grant API Gateway permission to invoke each alias
    const apiExecuteArn = api.arnForExecuteApi('*', '/*', '*')
    const apigwPrincipal = new iam.ServicePrincipal('apigateway.amazonaws.com')

    for (const [alias, suffix] of [
      [intakeDevAlias, 'IntakeDevAlias'],
      [intakeProdAlias, 'IntakeProdAlias'],
      [calendlyDevAlias, 'CalendlyDevAlias'],
      [calendlyProdAlias, 'CalendlyProdAlias'],
    ] as [lambda.Alias, string][]) {
      alias.addPermission(`Invoke${suffix}`, {
        principal: apigwPrincipal,
        sourceArn: apiExecuteArn,
      })
    }

    // ── Deployment + stages ──────────────────────────────────────────────────
    const deployment = new apigateway.Deployment(this, 'Deployment', { api })

    const devStage = new apigateway.Stage(this, 'DevStage', {
      deployment,
      stageName: 'dev',
      variables: { alias: 'dev' },
      description: 'Development stage — routes to dev alias and aintern-intake-submissions-dev',
    })

    const prodStage = new apigateway.Stage(this, 'ProdStage', {
      deployment,
      stageName: 'prod',
      variables: { alias: 'prod' },
      description: 'Production stage — routes to prod alias and aintern-intake-submissions-prod',
    })

    // ── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'IntakeApiUrlDev', {
      value: devStage.urlForPath('/intake'),
      description: 'Dev POST /intake endpoint',
      exportName: 'aintern-intake-api-url-dev',
    })

    new cdk.CfnOutput(this, 'IntakeApiUrlProd', {
      value: prodStage.urlForPath('/intake'),
      description: 'Prod POST /intake endpoint — use as VITE_API_BASE_URL',
      exportName: 'aintern-intake-api-url-prod',
    })

    new cdk.CfnOutput(this, 'CalendlyWebhookUrlDev', {
      value: devStage.urlForPath('/calendly-webhook'),
      description: 'Dev POST /calendly-webhook endpoint',
      exportName: 'aintern-calendly-webhook-url-dev',
    })

    new cdk.CfnOutput(this, 'CalendlyWebhookUrlProd', {
      value: prodStage.urlForPath('/calendly-webhook'),
      description: 'Prod POST /calendly-webhook endpoint for Calendly',
      exportName: 'aintern-calendly-webhook-url-prod',
    })

    cdk.Tags.of(this).add('Project', 'aintern')
    cdk.Tags.of(this).add('ManagedBy', 'cdk')
    cdk.Tags.of(this).add('Feature', 'intake')
  }
}
