#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { KennisbankStack } from '../lib/kennisbank-stack'

const app = new cdk.App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'eu-west-2',
}

new KennisbankStack(app, 'AInternKennisbankStack', {
  env,
  description: 'AIntern Kennisbank — publieke S3 bucket voor AI-gegenereerde blogcontent',
})
