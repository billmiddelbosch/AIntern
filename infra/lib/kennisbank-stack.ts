import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export class KennisbankStack extends cdk.Stack {
  public readonly bucket: s3.Bucket
  public readonly bucketUrl: string

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Public S3 bucket voor AI-gegenereerde blogcontent.
    // Content wordt geschreven door Claude/NotebookLM agents via AWS SDK.
    // Publiceren vereist geen code-deploy — alleen een PUT naar S3.
    this.bucket = new s3.Bucket(this, 'KennisbankBucket', {
      bucketName: 'aintern-kennisbank',
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
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    this.bucketUrl = `https://${this.bucket.bucketName}.s3.eu-west-2.amazonaws.com`

    cdk.Tags.of(this).add('Project', 'aintern')
    cdk.Tags.of(this).add('ManagedBy', 'cdk')
    cdk.Tags.of(this).add('Feature', 'kennisbank')

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Naam van de Kennisbank S3 bucket',
      exportName: 'aintern-kennisbank-bucket-name',
    })

    new cdk.CfnOutput(this, 'BucketUrl', {
      value: this.bucketUrl,
      description: 'Base URL voor Kennisbank content — gebruik als VITE_KENNISBANK_BASE_URL',
      exportName: 'aintern-kennisbank-bucket-url',
    })
  }
}
