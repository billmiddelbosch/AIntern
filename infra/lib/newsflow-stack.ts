import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { Construct } from 'constructs'

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

    // ── Tags ─────────────────────────────────────────────────────────────────
    cdk.Tags.of(this).add('Project', 'aintern')
    cdk.Tags.of(this).add('ManagedBy', 'cdk')
    cdk.Tags.of(this).add('Feature', 'newsflow')
  }
}
