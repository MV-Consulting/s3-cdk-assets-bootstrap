import { GithubActionsIdentityProvider, GithubActionsRole } from 'aws-cdk-github-oidc';
import {
  CfnOutput,
  Stack,
  StackProps,
  aws_s3 as s3,
  aws_iam as iam,
  Duration,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UploadRolesConfig } from './common';

export interface GithubRepoProps {
  owner: string;
  repo: string;
  filter: string;
  assetObjectKeysPattern: string;
  releaseObjectKeysPattern: string;
}

export interface DistributionStackProps extends StackProps {
  stage: string;
  devRetentionDays?: number;
  githubRepoProps: GithubRepoProps[];
  releaseBucketProps: {
    prefix: string;
  };
}

export class DistributionStack extends Stack {
  public readonly uploadRoleConfigs: UploadRolesConfig[];

  constructor(scope: Construct, id: string, props: DistributionStackProps) {
    super(scope, id, props);

    const stage = props.stage;
    const bucketPrefix = props.releaseBucketProps.prefix;

    // 1. create role
    const provider = GithubActionsIdentityProvider.fromAccount(
      this,
      'GithubProvider',
    );

    const lifecycleRules: s3.LifecycleRule[] = [];
    if (stage === 'dev') {
      const devRetentionDays = props.devRetentionDays || 14;
      lifecycleRules.push({
        expiration: Duration.days(devRetentionDays),
      });
    }

    // 2. create release bucket
    // release-bucket
    const releaseBucket = new s3.Bucket(this, 'release-bucket', {
      bucketName: `${bucketPrefix}-releases`,
      versioned: false,
      removalPolicy: stage === 'dev' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      lifecycleRules: lifecycleRules,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      publicReadAccess: true,
    });

    // 3. grant permissions
    const uploadRoleConfigs: UploadRolesConfig[] = [];
    for (const githubRepoProps of props.githubRepoProps) {
      const { owner, repo, filter, assetObjectKeysPattern, releaseObjectKeysPattern } = githubRepoProps;
      const roleName = `ghActionOicd-${stage}-${owner}-${repo}`;
      const uploadRole = new GithubActionsRole(this, roleName, {
        maxSessionDuration: Duration.hours(1),
        provider: provider,
        owner: owner,
        repo: repo,
        filter: filter,
      });

      releaseBucket.grantPut(uploadRole, releaseObjectKeysPattern);
      // see https://github.com/aws/aws-cdk/issues/6808#issuecomment-675198204
      uploadRole.addToPolicy(new iam.PolicyStatement({
        actions: [
          's3:GetBucketLocation',
          's3:ListBucket',
        ],
        resources: [releaseBucket.bucketArn],
      }));

      new CfnOutput(this, `${roleName}-output`, {
        value: uploadRole.roleArn,
      });

      uploadRoleConfigs.push({
        uploadRole: uploadRole,
        assetObjectKeysPattern: assetObjectKeysPattern,
      });
    }
    this.uploadRoleConfigs = uploadRoleConfigs;
  };
}