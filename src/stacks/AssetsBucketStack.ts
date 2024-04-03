import {
  Stack,
  StackProps,
  aws_s3 as s3,
  aws_iam as iam,
  Duration,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UploadRolesConfig } from './common';

export interface AssetsBucketStackProps extends StackProps {
  stage: string;
  devRetentionDays?: number;
  region: string;
  prefix: string;
  uploadRoleConfigs: UploadRolesConfig[];
}

export class AssetsBucketStack extends Stack {
  constructor(scope: Construct, id: string, props: AssetsBucketStackProps) {
    super(scope, id, props);

    const stage = props.stage;
    const assetBucketRegion = props.region;
    const assetBucketPrefix = props.prefix;
    const uploadRoleConfigs = props.uploadRoleConfigs;

    const lifecycleRules: s3.LifecycleRule[] = [];
    if (stage === 'dev') {
      const devRetentionDays = props.devRetentionDays || 14;
      lifecycleRules.push({
        expiration: Duration.days(devRetentionDays),
      });
    }

    const assetBucket = new s3.Bucket(this, `${assetBucketPrefix}-${assetBucketRegion}`, {
      bucketName: `${assetBucketPrefix}-${assetBucketRegion}`,
      removalPolicy: stage === 'dev' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      lifecycleRules: lifecycleRules,
      versioned: false,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      publicReadAccess: true,
    });

    for (const uploadRoleConfig of uploadRoleConfigs) {
      const uploadRole = uploadRoleConfig.uploadRole;
      const assetObjectKeysPattern = uploadRoleConfig.assetObjectKeysPattern;
      assetBucket.grantPut(uploadRole, assetObjectKeysPattern);

      uploadRole.addToPolicy(new iam.PolicyStatement({
        actions: [
          's3:GetBucketLocation',
          's3:ListBucket',
        ],
        resources: [assetBucket.bucketArn],
      }));
    }

  }
}