import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import { Construct } from 'constructs'
import * as path from 'path'

export class AInternLoopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ── DynamoDB — aintern-loop table ─────────────────────────────────────────
    // Single-table design for the AInternLoop agent orchestration system.
    // Stores three item types: ACTION, ISSUE, AGENT.
    //
    // GSI1 access patterns:
    //   ACTION items: GSI1pk = TYPE#<type>, GSI1sk = STATUS#<status>#<urgency_desc>#<createdAt>
    //     → targetAgent claims highest-urgency open action (sorted by urgency desc, then time)
    //   ISSUE items:  GSI1pk = STATUS#<status>, GSI1sk = <createdAt>
    //     → IssueResolver queries all open issues
    //   AGENT items:  GSI1pk = SYSTEM#<system>, GSI1sk = <displayName>
    //     → admin lists all agents per system
    //
    // GSI2 access patterns:
    //   ACTION items: GSI2pk = AGENT#<targetAgent>, GSI2sk = STATUS#<status>#<createdAt>
    //     → IssueResolver queries on-hold actions per agent
    //   ISSUE items:  GSI2pk = AGENT#<agentName>, GSI2sk = <createdAt>
    //     → LearningAgent queries all issues attributed to a specific agent
    const loopTable = new dynamodb.Table(this, 'AInternLoopTable', {
      tableName: 'aintern-loop',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    // GSI1: primary query index — action type+status, issue status, agent system
    loopTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1sk', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    // GSI2: secondary query index — agent-scoped action/issue queries
    loopTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2sk', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    // ── SSM — publish table name for use by other Lambdas ─────────────────────
    new ssm.StringParameter(this, 'LoopTableNameParam', {
      parameterName: '/aintern/loop/table-name',
      stringValue: loopTable.tableName,
      description: 'aintern-loop DynamoDB table name — consumed by AInternLoop agent Lambdas',
    })

    // ── IAM — managed policy for LearningAgent (I-08) ────────────────────────
    // The LearningAgent is the ONLY Lambda permitted to write AGENT# items.
    // This policy is attached to the LearningAgent Lambda role in I-08 (ARN not yet known).
    // Condition restricts PutItem/UpdateItem to items whose leading key starts with 'AGENT#'.
    new iam.ManagedPolicy(this, 'LearningAgentWritePolicy', {
      managedPolicyName: 'aintern-loop-learning-agent-write',
      description: 'Grants LearningAgent PutItem/UpdateItem on aintern-loop restricted to AGENT# partition keys',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
          resources: [loopTable.tableArn],
          conditions: {
            // ForAnyValue (not ForAllValues) — ForAllValues evaluates to true when the
            // condition key is absent from the request context, which would bypass the
            // restriction and allow writes to any partition key prefix.
            'ForAnyValue:StringLike': {
              'dynamodb:LeadingKeys': ['AGENT#*'],
            },
          },
        }),
      ],
    })

    // ── Lambda ────────────────────────────────────────────────────────────────
    const lambdaCode = lambda.Code.fromAsset(path.resolve(__dirname, '../../lambda/dist'))

    // seed-agents: one-shot handler invoked manually after table is live.
    // Idempotent — uses conditional writes so re-running skips existing items.
    const seedFn = new lambda.Function(this, 'SeedAgentsFunction', {
      functionName: 'aintern-loop-seed-agents',
      handler: 'seed-ainternloop-agents.handler',
      description: 'One-shot seed handler — writes initial AGENT# config items to aintern-loop (invoke once after deploy)',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(30),
      environment: {
        LOOP_TABLE_NAME: loopTable.tableName,
      },
    })

    // Scoped PutItem-only on AGENT#* — seed function never touches ACTION# or ISSUE# items.
    // ForAnyValue is required: ForAllValues is permissive when the condition key is absent.
    seedFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem'],
        resources: [loopTable.tableArn],
        conditions: {
          'ForAnyValue:StringLike': {
            'dynamodb:LeadingKeys': ['AGENT#*'],
          },
        },
      }),
    )

    // ── IssueResolver Lambda (I-07) ──────────────────────────────────────────
    // Triggered every 30 minutes by EventBridge.
    // Queries open + escalated issues, calls Claude Haiku to determine resolution,
    // then either reactivates the blocked action or escalates to human.
    const issueResolverFn = new lambda.Function(this, 'IssueResolverFunction', {
      functionName: 'aintern-issueresolver',
      handler: 'issueresolver.handler',
      description: 'Analyses open AInternLoop issues every 30 min via Claude Haiku — resolves or escalates',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(300),   // 50 issues × ~5s Haiku = up to 4 min
      environment: {
        LOOP_TABLE_NAME: loopTable.tableName,
      },
    })

    // DynamoDB: full read on aintern-loop (Query GSI, GetItem on all item types)
    loopTable.grantReadData(issueResolverFn)

    // DynamoDB: UpdateItem on ISSUE# and ACTION# items (but NOT AGENT#)
    // PutItem for meta-issues (also ISSUE#*)
    // ForAnyValue (not ForAllValues) — ForAllValues evaluates to true when the
    // condition key is absent from the request context, which would bypass the restriction.
    issueResolverFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:UpdateItem', 'dynamodb:PutItem'],
        resources: [loopTable.tableArn],
        conditions: {
          'ForAnyValue:StringLike': {
            'dynamodb:LeadingKeys': ['ISSUE#*', 'ACTION#*'],
          },
        },
      }),
    )

    // SSM: Anthropic API key (both aliases)
    issueResolverFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/anthropic/api-key`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/anthropic/api-key`,
        ],
      }),
    )

    // KMS: decrypt SecureString (Anthropic key)
    issueResolverFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    // Lambda alias — prod only (EventBridge-triggered; no API Gateway stage routing needed)
    const issueResolverProdAlias = issueResolverFn.addAlias('prod')

    // EventBridge rule — rate(30 minutes) targeting the prod alias
    new events.Rule(this, 'IssueResolverSchedule', {
      ruleName: 'aintern-issueresolver-schedule',
      description: 'Triggers IssueResolver every 30 minutes',
      schedule: events.Schedule.rate(cdk.Duration.minutes(30)),
      targets: [new targets.LambdaFunction(issueResolverProdAlias)],
    })

    // ── LearningAgent Lambda (I-08) ──────────────────────────────────────────
    // Triggered daily at 04:00 UTC by EventBridge.
    // Reads recent issues per agent, calls Claude Sonnet to analyse patterns,
    // and updates AGENT# CONFIG instructions when confidence is high or medium.
    const learningAgentFn = new lambda.Function(this, 'LearningAgentFunction', {
      functionName: 'aintern-learningagent',
      handler: 'learningagent.handler',
      description: 'Daily agent-instruction tuner — analyses resolved issues and updates AGENT# CONFIG via Claude Sonnet',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(300),   // 5 agents × 5 issues × Sonnet = up to 4 min
      environment: {
        LOOP_TABLE_NAME: loopTable.tableName,
      },
    })

    // DynamoDB: Query-only on GSI1 (agent discovery) and GSI2 (issue lookup).
    // grantReadData is intentionally NOT used — it also grants GetItem, BatchGetItem,
    // and Scan across the entire table, which would expose ACTION# and ISSUE# items
    // (including errorContext fields) that LearningAgent has no business reading.
    learningAgentFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query'],
        resources: [
          loopTable.tableArn,
          `${loopTable.tableArn}/index/GSI1`,
          `${loopTable.tableArn}/index/GSI2`,
        ],
      }),
    )

    // DynamoDB: PutItem/UpdateItem on AGENT# items ONLY — governed by the pre-created
    // managed policy from I-06. LearningAgent must NOT write ACTION# or ISSUE# items.
    const learningAgentWritePolicy = iam.ManagedPolicy.fromManagedPolicyName(
      this,
      'LearningAgentWritePolicyRef',
      'aintern-loop-learning-agent-write',
    )
    learningAgentFn.role!.addManagedPolicy(learningAgentWritePolicy)

    // SSM: Anthropic API key (both aliases)
    learningAgentFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/dev/anthropic/api-key`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/aintern/prod/anthropic/api-key`,
        ],
      }),
    )

    // KMS: decrypt SecureString (Anthropic key)
    learningAgentFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` },
        },
      }),
    )

    // Lambda alias — prod only (EventBridge-triggered)
    const learningAgentProdAlias = learningAgentFn.addAlias('prod')

    // EventBridge rule — 04:00 UTC daily
    new events.Rule(this, 'LearningAgentSchedule', {
      ruleName: 'aintern-learningagent-schedule',
      description: 'Triggers LearningAgent at 04:00 UTC daily',
      schedule: events.Schedule.cron({ hour: '4', minute: '0' }),
      targets: [new targets.LambdaFunction(learningAgentProdAlias)],
    })

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'LoopTableArn', {
      value: loopTable.tableArn,
      description: 'aintern-loop DynamoDB table ARN',
      exportName: 'aintern-loop-table-arn',
    })

    // Table name is intentionally NOT exported as a CloudFormation output.
    // The SSM parameter /aintern/loop/table-name is the access-controlled
    // path for other Lambdas — stack exports are visible to any principal
    // with cloudformation:ListExports, which is broader than intended.

    new cdk.CfnOutput(this, 'LearningAgentWritePolicyArn', {
      value: `arn:aws:iam::${this.account}:policy/aintern-loop-learning-agent-write`,
      description: 'Managed policy ARN to attach to LearningAgent role in I-08',
      exportName: 'aintern-loop-learning-agent-write-policy-arn',
    })

    // ── Tags ─────────────────────────────────────────────────────────────────
    cdk.Tags.of(this).add('Project', 'aintern')
    cdk.Tags.of(this).add('ManagedBy', 'cdk')
    cdk.Tags.of(this).add('Feature', 'ainternloop')
  }
}
