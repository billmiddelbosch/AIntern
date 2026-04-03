#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { KennisbankStack } from '../lib/kennisbank-stack'
import { IntakeStack } from '../lib/intake-stack'

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
