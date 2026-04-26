import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import { Construct } from 'constructs'
import * as path from 'path'

export class PainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ── DynamoDB — PainDatabase ──────────────────────────────────────────────
    const painTable = new dynamodb.Table(this, 'PainDatabase', {
      tableName: 'PainDatabase',
      partitionKey: { name: 'signalId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'brancheDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    painTable.addGlobalSecondaryIndex({
      indexName: 'ByBrancheDate',
      partitionKey: { name: 'branche', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'datum', type: dynamodb.AttributeType.STRING },
    })

    // ── Lambda — signaaldetectie ─────────────────────────────────────────────
    const lambdaCode = lambda.Code.fromAsset(path.resolve(__dirname, '../../lambda/dist'))

    const signaalFn = new lambda.Function(this, 'SignaalDetectieFunction', {
      functionName: 'aintern-signaaldetectie',
      handler: 'signaaldetectie.handler',
      description: 'Detecteert MKB pijn-signalen op Reddit en slaat ze op in PainDatabase',
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambdaCode,
      timeout: cdk.Duration.seconds(60),
      environment: {
        PAIN_TABLE_NAME: painTable.tableName,
      },
    })

    // ── IAM — DynamoDB lezen en schrijven ────────────────────────────────────
    painTable.grantReadWriteData(signaalFn)

    // ── EventBridge — dagelijks om 06:00 UTC ─────────────────────────────────
    const rule = new events.Rule(this, 'SignaalDetectieSchedule', {
      ruleName: 'aintern-signaaldetectie-daily',
      schedule: events.Schedule.cron({ minute: '0', hour: '6' }),
      description: 'Trigger signaaldetectie Lambda elke dag om 06:00 UTC',
    })

    rule.addTarget(new targets.LambdaFunction(signaalFn))
  }
}
