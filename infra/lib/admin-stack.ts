import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
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

    // ── lead-crud Lambda ─────────────────────────────────────────────────────
    const leadCrudFn = new lambda.Function(this, 'LeadCrudFunction', {
      functionName: 'aintern-lead-crud',
      handler: 'lead-crud.handler',
      description: 'CRUD endpoints for leads — reads/writes aintern-admin DynamoDB table',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(10),
      environment: {
        JWT_SECRET_SSM_PREFIX: '/aintern/admin/jwt-secret',
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    leadCrudFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/admin/jwt-secret/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/*/dynamodb/table-name`,
        ],
      }),
    )

    leadCrudFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    adminTable.grantReadWriteData(leadCrudFn)

    // ── linkedin-posts Lambda ─────────────────────────────────────────────────
    const linkedInPostsFn = new lambda.Function(this, 'LinkedInPostsFunction', {
      functionName: 'aintern-linkedin-posts',
      handler: 'linkedin-posts.handler',
      description: 'CRUD endpoints for LinkedIn post drafts — reads/writes aintern-admin DynamoDB table',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(10),
      environment: {
        JWT_SECRET_SSM_PREFIX: '/aintern/admin/jwt-secret',
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    linkedInPostsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/admin/jwt-secret/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
        ],
      }),
    )

    linkedInPostsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    adminTable.grantReadWriteData(linkedInPostsFn)

    // ── Groei Systeem — signaaldetectie Lambda ────────────────────────────────
    const signaaldetectieFn = new lambda.Function(this, 'SignaaldetectieFunction', {
      functionName: 'aintern-signaaldetectie',
      handler: 'signaaldetectie.handler',
      description: 'Daily Reddit scraper — stores MKB pain signals in DynamoDB (B-36)',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(60),
      environment: {
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    signaaldetectieFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/anthropic/api-key`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/anthropic/api-key`,
        ],
      }),
    )

    signaaldetectieFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    adminTable.grantReadWriteData(signaaldetectieFn)

    const signaaldetectieProdAlias = signaaldetectieFn.addAlias('prod')

    new events.Rule(this, 'SignaaldetectieRule', {
      ruleName: 'aintern-signaaldetectie-daily',
      description: 'Triggers signaaldetectie Lambda daily at 06:00 UTC (08:00 Amsterdam)',
      schedule: events.Schedule.cron({ minute: '0', hour: '6' }),
      targets: [new targets.LambdaFunction(signaaldetectieProdAlias)],
    })

    // ── Groei Systeem — subreddit-config Lambda ───────────────────────────────
    const subredditConfigFn = new lambda.Function(this, 'SubredditConfigFunction', {
      functionName: 'aintern-subreddit-config',
      handler: 'subreddit-config.handler',
      description: 'Admin CRUD for SubredditConfig (B-36)',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(10),
      environment: {
        JWT_SECRET_SSM_PREFIX: '/aintern/admin/jwt-secret',
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    subredditConfigFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/admin/jwt-secret/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
        ],
      }),
    )

    subredditConfigFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    adminTable.grantReadWriteData(subredditConfigFn)

    const subredditConfigDevAlias = subredditConfigFn.addAlias('dev')
    const subredditConfigProdAlias = subredditConfigFn.addAlias('prod')

    // ── Groei Systeem — insight-extractie Lambda ──────────────────────────────
    const insightExtractieFn = new lambda.Function(this, 'InsightExtractieFunction', {
      functionName: 'aintern-insight-extractie',
      handler: 'insight-extractie.handler',
      description: 'Weekly Lambda: clusters PainSignals into OpportunityStatements (B-61)',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(90),
      environment: {
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    insightExtractieFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/anthropic/api-key`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/anthropic/api-key`,
        ],
      }),
    )

    insightExtractieFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    adminTable.grantReadWriteData(insightExtractieFn)

    const insightExtractieProdAlias = insightExtractieFn.addAlias('prod')

    new events.Rule(this, 'InsightExtractieRule', {
      ruleName: 'aintern-insight-extractie-weekly',
      description: 'Triggers insight-extractie Lambda every Monday at 07:00 UTC (09:00 Amsterdam)',
      schedule: events.Schedule.cron({ minute: '0', hour: '7', weekDay: 'MON' }),
      targets: [new targets.LambdaFunction(insightExtractieProdAlias)],
    })

    // ── Groei Systeem — content-engine Lambda ─────────────────────────────────
    const contentEngineFn = new lambda.Function(this, 'ContentEngineFunction', {
      functionName: 'aintern-content-engine',
      handler: 'content-engine.handler',
      description: 'Weekly Lambda: generates LinkedIn+X content from OpportunityStatements (B-53)',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(90),
      environment: {
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    contentEngineFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/anthropic/api-key`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/anthropic/api-key`,
        ],
      }),
    )

    contentEngineFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    adminTable.grantReadWriteData(contentEngineFn)

    const contentEngineProdAlias = contentEngineFn.addAlias('prod')

    new events.Rule(this, 'ContentEngineRule', {
      ruleName: 'aintern-content-engine-weekly',
      description: 'Triggers content-engine Lambda every Wednesday at 07:00 UTC (09:00 Amsterdam)',
      schedule: events.Schedule.cron({ minute: '0', hour: '7', weekDay: 'WED' }),
      targets: [new targets.LambdaFunction(contentEngineProdAlias)],
    })

    // ── Groei Systeem — soft-outreach-monitor Lambda ──────────────────────────
    const softOutreachFn = new lambda.Function(this, 'SoftOutreachMonitorFunction', {
      functionName: 'aintern-soft-outreach-monitor',
      handler: 'soft-outreach-monitor.handler',
      description: 'Daily Lambda: detects intent signals and creates OutreachAlerts (B-62)',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(60),
      environment: {
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    softOutreachFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/anthropic/api-key`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/anthropic/api-key`,
        ],
      }),
    )

    softOutreachFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    adminTable.grantReadWriteData(softOutreachFn)

    const softOutreachProdAlias = softOutreachFn.addAlias('prod')

    new events.Rule(this, 'SoftOutreachRule', {
      ruleName: 'aintern-soft-outreach-daily',
      description: 'Triggers soft-outreach-monitor Lambda daily at 07:00 UTC (09:00 Amsterdam)',
      schedule: events.Schedule.cron({ minute: '0', hour: '7' }),
      targets: [new targets.LambdaFunction(softOutreachProdAlias)],
    })

    // ── Groei Systeem — workflow-scan Lambda (public) ─────────────────────────
    const workflowScanFn = new lambda.Function(this, 'WorkflowScanFunction', {
      functionName: 'aintern-workflow-scan',
      handler: 'workflow-scan.handler',
      description: 'Public POST /workflow-scan — stores submission and returns AI recommendations (B-54)',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(30),
      environment: {
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    workflowScanFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/anthropic/api-key`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/anthropic/api-key`,
        ],
      }),
    )

    workflowScanFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    adminTable.grantReadWriteData(workflowScanFn)

    const workflowScanDevAlias = workflowScanFn.addAlias('dev')
    const workflowScanProdAlias = workflowScanFn.addAlias('prod')

    // ── Groei Systeem — sequence-scheduler Lambda ─────────────────────────────
    const sequenceSchedulerFn = new lambda.Function(this, 'SequenceSchedulerFunction', {
      functionName: 'aintern-sequence-scheduler',
      handler: 'sequence-scheduler.handler',
      description: 'Daily Lambda: advances cold email sequences (B-52)',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(30),
      environment: {
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    sequenceSchedulerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
        ],
      }),
    )

    adminTable.grantReadWriteData(sequenceSchedulerFn)

    const sequenceSchedulerProdAlias = sequenceSchedulerFn.addAlias('prod')

    new events.Rule(this, 'SequenceSchedulerRule', {
      ruleName: 'aintern-sequence-scheduler-daily',
      description: 'Triggers sequence-scheduler Lambda daily at 06:00 UTC (08:00 Amsterdam)',
      schedule: events.Schedule.cron({ minute: '0', hour: '6' }),
      targets: [new targets.LambdaFunction(sequenceSchedulerProdAlias)],
    })

    // ── Groei Systeem — flywheel-metrics Lambda ───────────────────────────────
    const flywheelMetricsFn = new lambda.Function(this, 'FlywheelMetricsFunction', {
      functionName: 'aintern-flywheel-metrics',
      handler: 'flywheel-metrics.handler',
      description: 'GET/PUT /admin/flywheel-metrics — weekly funnel metrics dashboard (B-63)',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(15),
      environment: {
        JWT_SECRET_SSM_PREFIX: '/aintern/admin/jwt-secret',
        DYNAMODB_TABLE_SSM_PREFIX: '/aintern',
      },
    })

    flywheelMetricsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/admin/jwt-secret/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/dynamodb/table-name`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/dynamodb/table-name`,
        ],
      }),
    )

    flywheelMetricsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    adminTable.grantReadWriteData(flywheelMetricsFn)

    const flywheelMetricsDevAlias = flywheelMetricsFn.addAlias('dev')
    const flywheelMetricsProdAlias = flywheelMetricsFn.addAlias('prod')

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

    const leadCrudDevAlias = leadCrudFn.addAlias('dev')
    const leadCrudProdAlias = leadCrudFn.addAlias('prod')

    const linkedInPostsDevAlias = linkedInPostsFn.addAlias('dev')
    const linkedInPostsProdAlias = linkedInPostsFn.addAlias('prod')

    // Groei Systeem aliases already created inline above
    // (signaaldetectie, insightExtractie, contentEngine, softOutreach,
    //  sequenceScheduler are prod-only for EventBridge; subredditConfig,
    //  workflowScan, flywheelMetrics have dev+prod for API Gateway)

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

    // GET + POST /admin/leads
    // GET + PUT /admin/leads/{id}
    const leadsResource = adminResource.addResource('leads')
    leadsResource.addMethod('GET', aliasIntegration(leadCrudFn))
    leadsResource.addMethod('POST', aliasIntegration(leadCrudFn))

    const leadResource = leadsResource.addResource('{id}')
    leadResource.addMethod('GET', aliasIntegration(leadCrudFn))
    leadResource.addMethod('PUT', aliasIntegration(leadCrudFn))

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

    // GET + POST /admin/linkedin-posts
    // GET + PUT + DELETE /admin/linkedin-posts/{id}
    const linkedInPostsResource = adminResource.addResource('linkedin-posts')
    linkedInPostsResource.addMethod('GET', aliasIntegration(linkedInPostsFn))
    linkedInPostsResource.addMethod('POST', aliasIntegration(linkedInPostsFn))

    const linkedInPostByIdResource = linkedInPostsResource.addResource('{id}')
    linkedInPostByIdResource.addMethod('GET', aliasIntegration(linkedInPostsFn))
    linkedInPostByIdResource.addMethod('PUT', aliasIntegration(linkedInPostsFn))
    linkedInPostByIdResource.addMethod('DELETE', aliasIntegration(linkedInPostsFn))

    // GET + POST /admin/subreddit-config
    // PUT + DELETE /admin/subreddit-config/{name}
    const subredditConfigResource = adminResource.addResource('subreddit-config')
    subredditConfigResource.addMethod('GET', aliasIntegration(subredditConfigFn))
    subredditConfigResource.addMethod('POST', aliasIntegration(subredditConfigFn))

    const subredditByNameResource = subredditConfigResource.addResource('{name}')
    subredditByNameResource.addMethod('PUT', aliasIntegration(subredditConfigFn))
    subredditByNameResource.addMethod('DELETE', aliasIntegration(subredditConfigFn))

    // GET + PUT /admin/flywheel-metrics
    const flywheelMetricsResource = adminResource.addResource('flywheel-metrics')
    flywheelMetricsResource.addMethod('GET', aliasIntegration(flywheelMetricsFn))
    flywheelMetricsResource.addMethod('PUT', aliasIntegration(flywheelMetricsFn))

    // GET /admin/pain-signals (read-only, shares flywheel-metrics handler)
    const painSignalsResource = adminResource.addResource('pain-signals')
    painSignalsResource.addMethod('GET', aliasIntegration(flywheelMetricsFn))

    // POST /workflow-scan (public — no JWT required)
    const workflowScanResource = api.root.addResource('workflow-scan')
    workflowScanResource.addMethod('POST', aliasIntegration(workflowScanFn))

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
      [leadCrudDevAlias, 'LeadCrudDevAlias'],
      [leadCrudProdAlias, 'LeadCrudProdAlias'],
      [linkedInPostsDevAlias, 'LinkedInPostsDevAlias'],
      [linkedInPostsProdAlias, 'LinkedInPostsProdAlias'],
      [subredditConfigDevAlias, 'SubredditConfigDevAlias'],
      [subredditConfigProdAlias, 'SubredditConfigProdAlias'],
      [workflowScanDevAlias, 'WorkflowScanDevAlias'],
      [workflowScanProdAlias, 'WorkflowScanProdAlias'],
      [flywheelMetricsDevAlias, 'FlywheelMetricsDevAlias'],
      [flywheelMetricsProdAlias, 'FlywheelMetricsProdAlias'],
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
