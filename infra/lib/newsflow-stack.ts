import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import { Construct } from 'constructs'
import * as path from 'path'

export class NewsFlowStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ── DynamoDB — aintern-newsflow table (I-10) ──────────────────────────────
    // Stores LANDING_PAGE#<slug> items — one per published NewsFlow page.
    // No TTL — landing page data is permanent (SEO history).
    //
    // GSI1 access patterns:
    //   LANDING_PAGE items: GSI1pk = STATUS#<status>, GSI1sk = <publishedAt>
    //     → SEOOptimizer queries all 'published' pages sorted oldest first
    //       (i.e. longest not optimised)
    //
    // GSI2 access patterns:
    //   LANDING_PAGE items: GSI2pk = SCORE#<urgencyBucket>, GSI2sk = <publishedAt>
    //     → Admin panel filters pages by urgency category
    const newsflowTable = new dynamodb.Table(this, 'NewsFlowTable', {
      tableName: 'aintern-newsflow',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    newsflowTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1sk', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    newsflowTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2sk', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    // ── SSM — table name for NewsFlow Lambdas ─────────────────────────────────
    new ssm.StringParameter(this, 'NewsFlowTableNameParam', {
      parameterName: '/aintern/newsflow/table-name',
      stringValue: newsflowTable.tableName,
      description: 'aintern-newsflow DynamoDB table name — consumed by ContentBuilder, SEOOptimizer',
    })

    // ── S3 — aintern-newsflow content bucket ──────────────────────────────────
    // Public-read bucket following the same pattern as aintern-kennisbank.
    // ContentBuilder writes posts/<slug>.json via AWS SDK S3 PutObject.
    // Vue frontend fetches via public HTTP URL (no SDK credentials in browser).
    //
    // SSM params to create manually before first deploy:
    //   (none — bucket name is static 'aintern-newsflow')
    //
    // GitHub token (for I-14 branch-workflow) — create manually:
    //   aws ssm put-parameter --name /aintern/dev/github/token \
    //     --value "<PAT with repo scope>" --type SecureString --region eu-west-2
    //   aws ssm put-parameter --name /aintern/prod/github/token \
    //     --value "<PAT with repo scope>" --type SecureString --region eu-west-2
    const newsflowBucket = new s3.Bucket(this, 'NewsFlowBucket', {
      bucketName: 'aintern-newsflow',
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      publicReadAccess: true,
      cors: [
        {
          allowedOrigins: [
            'https://aintern.nl',
            'https://www.aintern.nl',
            'https://test.aintern.nl',
            'http://localhost:5173',
          ],
          allowedMethods: [s3.HttpMethods.GET],
          allowedHeaders: ['Content-Type', 'Range'],
          maxAge: 3600,
        },
      ],
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    // ── SSM — bucket name ─────────────────────────────────────────────────────
    new ssm.StringParameter(this, 'NewsFlowBucketNameParam', {
      parameterName: '/aintern/newsflow/bucket-name',
      stringValue: newsflowBucket.bucketName,
      description: 'aintern-newsflow S3 bucket name — consumed by ContentBuilder Lambda',
    })

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'NewsFlowTableArn', {
      value: newsflowTable.tableArn,
      description: 'aintern-newsflow DynamoDB table ARN',
      exportName: 'aintern-newsflow-table-arn',
    })

    new cdk.CfnOutput(this, 'NewsFlowBucketUrl', {
      value: `https://${newsflowBucket.bucketName}.s3.eu-west-2.amazonaws.com`,
      description: 'Base URL for newsflow content — set as VITE_NEWSFLOW_BASE_URL',
      exportName: 'aintern-newsflow-bucket-url',
    })

    // ── DynamoDB — import aintern-loop table (owned by AInternLoopStack) ─────
    const loopTable = dynamodb.Table.fromTableAttributes(this, 'LoopTableRef', {
      tableName: 'aintern-loop',
      grantIndexPermissions: true,
    })

    // ── Lambda — NewsAnalyzer (I-11) ──────────────────────────────────────────
    const lambdaCode = lambda.Code.fromAsset(path.resolve(__dirname, '../../lambda/dist'))

    const newsAnalyzerFn = new lambda.Function(this, 'NewsAnalyzerFunction', {
      functionName: 'aintern-newsanalyzer',
      handler: 'newsanalyzer.handler',
      description: 'Daily RSS → Claude Haiku → newsflow/content actions in AInternLoop (I-11)',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(300),   // 40 items × ~3s Haiku = up to 2 min
      environment: {
        LOOP_TABLE_NAME: loopTable.tableName,
      },
    })

    // IAM — DynamoDB read on aintern-loop (for dedup query on GSI1 + getAgentInstruction)
    loopTable.grantReadData(newsAnalyzerFn)

    // IAM — DynamoDB write on aintern-loop, ACTION# items only (registerAction)
    // ForAnyValue (not ForAllValues) — ForAllValues evaluates to true when the condition
    // key is absent from the request context, bypassing the restriction.
    newsAnalyzerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:PutItem'],
        resources: [loopTable.tableArn],
        conditions: {
          'ForAnyValue:StringLike': {
            'dynamodb:LeadingKeys': ['ACTION#*'],
          },
        },
      }),
    )

    // IAM — SSM: Anthropic API key for both aliases
    newsAnalyzerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/anthropic/api-key`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/anthropic/api-key`,
        ],
      }),
    )

    // IAM — KMS: decrypt SecureString (Anthropic key)
    newsAnalyzerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    // Lambda alias — prod only (EventBridge-triggered)
    const newsAnalyzerProdAlias = newsAnalyzerFn.addAlias('prod')

    // EventBridge rule — 06:00 UTC daily
    new events.Rule(this, 'NewsAnalyzerSchedule', {
      ruleName: 'aintern-newsanalyzer-schedule',
      description: 'Triggers NewsAnalyzer at 06:00 UTC daily to analyse RSS feeds',
      schedule: events.Schedule.cron({ hour: '6', minute: '0' }),
      targets: [new targets.LambdaFunction(newsAnalyzerProdAlias)],
    })

    // ── Tags ─────────────────────────────────────────────────────────────────
    cdk.Tags.of(this).add('Project', 'aintern')
    cdk.Tags.of(this).add('ManagedBy', 'cdk')
    cdk.Tags.of(this).add('Feature', 'newsflow')
  }
}
