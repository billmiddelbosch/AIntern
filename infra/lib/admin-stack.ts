import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import * as path from 'path'

export class AdminStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

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

    // ── Lambda aliases ───────────────────────────────────────────────────────
    const adminAuthDevAlias = adminAuthFn.addAlias('dev')
    const adminAuthProdAlias = adminAuthFn.addAlias('prod')

    // ── API Gateway ──────────────────────────────────────────────────────────
    const api = new apigateway.RestApi(this, 'AInternAdminApi', {
      restApiName: 'aintern-admin-api',
      description: 'AIntern admin authentication API (login + first-run register)',
      deploy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://aintern.nl', 'https://www.aintern.nl', 'http://localhost:5173'],
        allowMethods: ['POST', 'OPTIONS'],
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

    // ── API Gateway → Lambda permissions ─────────────────────────────────────
    const apiExecuteArn = api.arnForExecuteApi('*', '/*', '*')
    const apigwPrincipal = new iam.ServicePrincipal('apigateway.amazonaws.com')

    for (const [alias, suffix] of [
      [adminAuthDevAlias, 'AdminAuthDevAlias'],
      [adminAuthProdAlias, 'AdminAuthProdAlias'],
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

    // ── Tags ─────────────────────────────────────────────────────────────────
    cdk.Tags.of(this).add('Project', 'aintern')
    cdk.Tags.of(this).add('ManagedBy', 'cdk')
    cdk.Tags.of(this).add('Feature', 'admin-auth')
  }
}
