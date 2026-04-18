import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { Construct } from 'constructs'
import * as path from 'path'

export class AdminStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ── DynamoDB — import existing table (created via staging deploy) ────────
    // Table was already provisioned; importing avoids "already exists" on redeploy.
    // GSI AssigneeIndex is already present on the physical table.
    const adminTable = dynamodb.Table.fromTableAttributes(this, 'AdminTable', {
      tableName: 'aintern-admin',
      grantIndexPermissions: true,
    })

    // SSM parameters /aintern/{dev|prod}/dynamodb/table-name already exist in SSM
    // (pre-provisioned by the staging deploy). Not managed here to avoid CloudFormation
    // "already exists" conflicts. Create manually if deploying to a fresh environment:
    //   aws ssm put-parameter --name /aintern/dev/dynamodb/table-name \
    //     --value aintern-admin --type String --region eu-west-2
    //   aws ssm put-parameter --name /aintern/prod/dynamodb/table-name \
    //     --value aintern-admin --type String --region eu-west-2

    // ── Lambda ───────────────────────────────────────────────────────────────
    const lambdaCode = lambda.Code.fromAsset(path.resolve(__dirname, '../../lambda/dist'))

    const adminAuthFn = new lambda.Function(this, 'AdminAuthFunction', {
      functionName: 'aintern-admin-auth',
      handler: 'admin-auth.handler',
      description: 'Verifies admin credentials (SSM + bcrypt) and issues signed JWTs',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(15),
      environment: {
        JWT_SECRET_SSM_PREFIX: '/aintern/admin/jwt-secret',
        ADMIN_USERS_SSM_PREFIX: '/aintern/admin/users',
      },
    })

    // ── IAM — SSM read/write for admin params ────────────────────────────────
    adminAuthFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:PutParameter'],
        resources: ['*'],
      }),
    )

    // KMS decrypt/encrypt for SecureString parameters (AWS managed key)
    adminAuthFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    // ── kpi-actuals Lambda ────────────────────────────────────────────────────
    const kpiActualsFn = new lambda.Function(this, 'KpiActualsFunction', {
      functionName: 'aintern-kpi-actuals',
      handler: 'kpi-actuals.handler',
      description: 'GET + PUT KPI actuals for a given ISO week — reads/writes aintern-admin DynamoDB table',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(10),
      environment: {
        JWT_SECRET_SSM_PREFIX: '/aintern/admin/jwt-secret',
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    // SSM read: JWT secret + DynamoDB table name
    kpiActualsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/admin/jwt-secret/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
        ],
      }),
    )

    // KMS decrypt for SecureString JWT secret
    kpiActualsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    // DynamoDB access: GetItem, PutItem, Query on aintern-admin table
    adminTable.grantReadWriteData(kpiActualsFn)

    // ── meeting-actions Lambda ────────────────────────────────────────────────
    const meetingActionsFn = new lambda.Function(this, 'MeetingActionsFunction', {
      functionName: 'aintern-meeting-actions',
      handler: 'meeting-actions.handler',
      description: 'CRUD endpoints for meeting action items — reads/writes aintern-admin DynamoDB table',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(10),
      environment: {
        JWT_SECRET_SSM_PREFIX: '/aintern/admin/jwt-secret',
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    // SSM read: JWT secret + DynamoDB table name
    meetingActionsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/admin/jwt-secret/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
        ],
      }),
    )

    // KMS decrypt for SecureString JWT secret
    meetingActionsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    // DynamoDB access: GetItem, PutItem, Query, UpdateItem on aintern-admin table
    adminTable.grantReadWriteData(meetingActionsFn)

    // ── kpi-integrations Lambda ───────────────────────────────────────────────
    const kpiIntegrationsFn = new lambda.Function(this, 'KpiIntegrationsFunction', {
      functionName: 'aintern-kpi-integrations',
      handler: 'kpi-integrations.handler',
      description: 'POST /admin/kpi/refresh — pulls automated KPI actuals from S3, outreach CSV, and GA4',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(30),
      environment: {
        JWT_SECRET_SSM_PREFIX: '/aintern/admin/jwt-secret',
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
        GA4_SA_SSM_PATH: '/aintern/{alias}/ga4/service-account-json',
        GA4_PROPERTY_SSM_PATH: '/aintern/{alias}/ga4/property-id',
      },
    })

    // SSM read: JWT secret + DynamoDB table name + GA4 credentials
    kpiIntegrationsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/admin/jwt-secret/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/ga4/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/ga4/*`,
        ],
      }),
    )

    // KMS decrypt for SecureString parameters (JWT secret + GA4 service account JSON)
    kpiIntegrationsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    // S3: GetObject on outreach CSV + backlog.md + ListBucket on aintern-kennisbank
    kpiIntegrationsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [
          'arn:aws:s3:::aintern-kennisbank/admin-assets/outreach-log.csv',
          'arn:aws:s3:::aintern-kennisbank/admin-assets/backlog.md',
        ],
      }),
    )

    kpiIntegrationsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:ListBucket'],
        resources: ['arn:aws:s3:::aintern-kennisbank'],
      }),
    )

    // DynamoDB access: read/write on aintern-admin table
    adminTable.grantReadWriteData(kpiIntegrationsFn)

    // ── kennisbank-admin Lambda ───────────────────────────────────────────────
    const kennisbankAdminFn = new lambda.Function(this, 'KennisbankAdminFunction', {
      functionName: 'aintern-kennisbank-admin',
      handler: 'kennisbank-admin.handler',
      description: 'GET /admin/kennisbank — lists Kennisbank articles from S3 with status and last-modified',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(15),
      environment: {
        JWT_SECRET_SSM_PREFIX: '/aintern/admin/jwt-secret',
      },
    })

    kennisbankAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/admin/jwt-secret/*`,
        ],
      }),
    )

    kennisbankAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    kennisbankAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:ListBucket'],
        resources: ['arn:aws:s3:::aintern-kennisbank'],
      }),
    )

    kennisbankAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [
          'arn:aws:s3:::aintern-kennisbank/index.json',
          'arn:aws:s3:::aintern-kennisbank/posts/*',
        ],
      }),
    )

    kennisbankAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject'],
        resources: [
          'arn:aws:s3:::aintern-kennisbank/posts/*',
          'arn:aws:s3:::aintern-kennisbank/index.json',
          'arn:aws:s3:::aintern-kennisbank/sitemap.xml',
        ],
      }),
    )

    kennisbankAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:DeleteObject'],
        resources: ['arn:aws:s3:::aintern-kennisbank/posts/*'],
      }),
    )

    // ── Lambda aliases ───────────────────────────────────────────────────────
    const adminAuthDevAlias = adminAuthFn.addAlias('dev')
    const adminAuthProdAlias = adminAuthFn.addAlias('prod')

    const kpiActualsDevAlias = kpiActualsFn.addAlias('dev')
    const kpiActualsProdAlias = kpiActualsFn.addAlias('prod')

    const meetingActionsDevAlias = meetingActionsFn.addAlias('dev')
    const meetingActionsProdAlias = meetingActionsFn.addAlias('prod')

    const kpiIntegrationsDevAlias = kpiIntegrationsFn.addAlias('dev')
    const kpiIntegrationsProdAlias = kpiIntegrationsFn.addAlias('prod')

    const kennisbankAdminDevAlias = kennisbankAdminFn.addAlias('dev')
    const kennisbankAdminProdAlias = kennisbankAdminFn.addAlias('prod')

    // ── API Gateway ──────────────────────────────────────────────────────────
    const api = new apigateway.RestApi(this, 'AInternAdminApi', {
      restApiName: 'aintern-admin-api',
      description: 'AIntern admin authentication API (login + first-run register)',
      deploy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://aintern.nl', 'https://www.aintern.nl', 'https://test.aintern.nl', 'http://localhost:5173'],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    })

    // Integration: stage variable `alias` routes to the correct Lambda alias
    const aliasIntegration = (fn: lambda.Function) =>
      new apigateway.Integration({
        type: apigateway.IntegrationType.AWS_PROXY,
        integrationHttpMethod: 'POST',
        uri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${fn.functionArn}:\${stageVariables.alias}/invocations`,
      })

    const adminResource = api.root.addResource('admin')
    adminResource.addResource('login').addMethod('POST', aliasIntegration(adminAuthFn))
    adminResource.addResource('register').addMethod('POST', aliasIntegration(adminAuthFn))

    // GET + PUT /admin/kpi/actuals
    // POST /admin/kpi/refresh
    const kpiResource = adminResource.addResource('kpi')
    const actualsResource = kpiResource.addResource('actuals')
    actualsResource.addMethod('GET', aliasIntegration(kpiActualsFn))
    actualsResource.addMethod('PUT', aliasIntegration(kpiActualsFn))

    const refreshResource = kpiResource.addResource('refresh')
    refreshResource.addMethod('POST', aliasIntegration(kpiIntegrationsFn))

    // GET /admin/meetings + GET /admin/meetings/{date}
    // POST /admin/meetings/{date}/items
    // PATCH /admin/meetings/{date}/items/{id}
    const meetingsResource = adminResource.addResource('meetings')
    meetingsResource.addMethod('GET', aliasIntegration(meetingActionsFn))

    const meetingByDateResource = meetingsResource.addResource('{date}')
    meetingByDateResource.addMethod('GET', aliasIntegration(meetingActionsFn))

    const meetingItemsResource = meetingByDateResource.addResource('items')
    meetingItemsResource.addMethod('POST', aliasIntegration(meetingActionsFn))

    const meetingItemByIdResource = meetingItemsResource.addResource('{id}')
    meetingItemByIdResource.addMethod('PATCH', aliasIntegration(meetingActionsFn))

    // GET /admin/kennisbank
    // GET|PUT|DELETE /admin/kennisbank/{slug}
    // POST /admin/kennisbank/{slug}/publish
    const kennisbankResource = adminResource.addResource('kennisbank')
    kennisbankResource.addMethod('GET', aliasIntegration(kennisbankAdminFn))

    const kennisbankSlugResource = kennisbankResource.addResource('{slug}')
    kennisbankSlugResource.addMethod('GET', aliasIntegration(kennisbankAdminFn))
    kennisbankSlugResource.addMethod('PUT', aliasIntegration(kennisbankAdminFn))
    kennisbankSlugResource.addMethod('DELETE', aliasIntegration(kennisbankAdminFn))

    const kennisbankPublishResource = kennisbankSlugResource.addResource('publish')
    kennisbankPublishResource.addMethod('POST', aliasIntegration(kennisbankAdminFn))

    // ── API Gateway → Lambda permissions ─────────────────────────────────────
    const apiExecuteArn = api.arnForExecuteApi('*', '/*', '*')
    const apigwPrincipal = new iam.ServicePrincipal('apigateway.amazonaws.com')

    for (const [alias, suffix] of [
      [adminAuthDevAlias, 'AdminAuthDevAlias'],
      [adminAuthProdAlias, 'AdminAuthProdAlias'],
      [kpiActualsDevAlias, 'KpiActualsDevAlias'],
      [kpiActualsProdAlias, 'KpiActualsProdAlias'],
      [meetingActionsDevAlias, 'MeetingActionsDevAlias'],
      [meetingActionsProdAlias, 'MeetingActionsProdAlias'],
      [kpiIntegrationsDevAlias, 'KpiIntegrationsDevAlias'],
      [kpiIntegrationsProdAlias, 'KpiIntegrationsProdAlias'],
      [kennisbankAdminDevAlias, 'KennisbankAdminDevAlias'],
      [kennisbankAdminProdAlias, 'KennisbankAdminProdAlias'],
    ] as [lambda.Alias, string][]) {
      alias.addPermission(`Invoke${suffix}`, {
        principal: apigwPrincipal,
        sourceArn: apiExecuteArn,
      })
    }

    // ── Deployment + stages ──────────────────────────────────────────────────
    const deployment = new apigateway.Deployment(this, 'AdminDeployment', { api })

    const devStage = new apigateway.Stage(this, 'AdminDevStage', {
      deployment,
      stageName: 'dev',
      variables: { alias: 'dev' },
      description: 'Development stage — routes to dev alias',
    })

    const prodStage = new apigateway.Stage(this, 'AdminProdStage', {
      deployment,
      stageName: 'prod',
      variables: { alias: 'prod' },
      description: 'Production stage — routes to prod alias',
    })

    // ── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'AdminLoginUrlDev', {
      value: devStage.urlForPath('/admin/login'),
      description: 'Dev POST /admin/login endpoint — use as VITE_ADMIN_API_BASE_URL (without path)',
      exportName: 'aintern-admin-login-url-dev',
    })

    new cdk.CfnOutput(this, 'AdminLoginUrlProd', {
      value: prodStage.urlForPath('/admin/login'),
      description: 'Prod POST /admin/login endpoint',
      exportName: 'aintern-admin-login-url-prod',
    })

    new cdk.CfnOutput(this, 'AdminRegisterUrlDev', {
      value: devStage.urlForPath('/admin/register'),
      description: 'Dev POST /admin/register endpoint (first-run only)',
      exportName: 'aintern-admin-register-url-dev',
    })

    new cdk.CfnOutput(this, 'AdminRegisterUrlProd', {
      value: prodStage.urlForPath('/admin/register'),
      description: 'Prod POST /admin/register endpoint (first-run only)',
      exportName: 'aintern-admin-register-url-prod',
    })

    new cdk.CfnOutput(this, 'AdminApiBaseUrlDev', {
      value: devStage.urlForPath('/'),
      description: 'Dev admin API base URL — set as VITE_ADMIN_API_BASE_URL in .env',
      exportName: 'aintern-admin-api-base-url-dev',
    })

    new cdk.CfnOutput(this, 'AdminApiBaseUrlProd', {
      value: prodStage.urlForPath('/'),
      description: 'Prod admin API base URL — set as VITE_ADMIN_API_BASE_URL in .env.production',
      exportName: 'aintern-admin-api-base-url-prod',
    })

    new cdk.CfnOutput(this, 'KpiActualsUrlDev', {
      value: devStage.urlForPath('/admin/kpi/actuals'),
      description: 'Dev GET|PUT /admin/kpi/actuals endpoint',
      exportName: 'aintern-kpi-actuals-url-dev',
    })

    new cdk.CfnOutput(this, 'KpiActualsUrlProd', {
      value: prodStage.urlForPath('/admin/kpi/actuals'),
      description: 'Prod GET|PUT /admin/kpi/actuals endpoint',
      exportName: 'aintern-kpi-actuals-url-prod',
    })

    new cdk.CfnOutput(this, 'MeetingsUrlDev', {
      value: devStage.urlForPath('/admin/meetings'),
      description: 'Dev GET /admin/meetings endpoint',
      exportName: 'aintern-meetings-url-dev',
    })

    new cdk.CfnOutput(this, 'MeetingsUrlProd', {
      value: prodStage.urlForPath('/admin/meetings'),
      description: 'Prod GET /admin/meetings endpoint',
      exportName: 'aintern-meetings-url-prod',
    })

    new cdk.CfnOutput(this, 'AdminDynamoDbTableName', {
      value: adminTable.tableName,
      description: 'aintern-admin DynamoDB table name',
      exportName: 'aintern-admin-dynamodb-table-name',
    })

    new cdk.CfnOutput(this, 'KpiRefreshUrlDev', {
      value: devStage.urlForPath('/admin/kpi/refresh'),
      description: 'Dev POST /admin/kpi/refresh endpoint',
      exportName: 'aintern-kpi-refresh-url-dev',
    })

    new cdk.CfnOutput(this, 'KpiRefreshUrlProd', {
      value: prodStage.urlForPath('/admin/kpi/refresh'),
      description: 'Prod POST /admin/kpi/refresh endpoint',
      exportName: 'aintern-kpi-refresh-url-prod',
    })

    // ── Tags ─────────────────────────────────────────────────────────────────
    cdk.Tags.of(this).add('Project', 'aintern')
    cdk.Tags.of(this).add('ManagedBy', 'cdk')
    cdk.Tags.of(this).add('Feature', 'admin-auth')
  }
}
