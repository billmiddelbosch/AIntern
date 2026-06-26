#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { KennisbankStack } from '../lib/kennisbank-stack'
import { IntakeStack } from '../lib/intake-stack'
import { AdminStack } from '../lib/admin-stack'
import { AInternLoopStack } from '../lib/ainternloop-stack'
import { NewsFlowStack } from '../lib/newsflow-stack'

const app = new cdk.App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'eu-west-2',
}

new KennisbankStack(app, 'AInternKennisbankStack', {
  env,
  description: 'AIntern Kennisbank — publieke S3 bucket voor AI-gegenereerde blogcontent',
})

new IntakeStack(app, 'AInternIntakeStack', {
  env,
  description: 'AIntern Intake — API Gateway → Lambda → DynamoDB intake pipeline',
})

new AdminStack(app, 'AInternAdminStack', {
  env,
  description: 'AIntern Admin — API Gateway → Lambda login + register with JWT and SSM',
})

new AInternLoopStack(app, 'AInternLoopStack', {
  env,
  description: 'AIntern Loop — DynamoDB table + IAM governance for agent orchestration system',
})

new NewsFlowStack(app, 'AInternNewsFlowStack', {
  env,
  description: 'AIntern NewsFlow — DynamoDB landing_pages table + S3 content bucket (I-10)',
})

