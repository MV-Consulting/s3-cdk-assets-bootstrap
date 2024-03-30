import { GithubActionsIdentityProvider, GithubActionsRole } from 'aws-cdk-github-oidc';
import {
  App, CfnOutput, Stack, StackProps,
  aws_s3 as s3,
  aws_iam as iam,
  Duration,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface GithubRepoProps {
  owner: string;
  repo: string;
  filter: string;
  assetObjectKeysPattern: string;
  releaseObjectKeysPattern: string;
}

export interface MyStackProps extends StackProps {
  stage: string;
  githubRepoProps: GithubRepoProps[];
  assetBucketProps: {
    regions: string[];
    prefix: string;
  };
  releaseBucketProps: {
    prefix: string;
  };

}

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    const stage = props.stage;
    const bucketPrefix = props.releaseBucketProps.prefix;

    const assetBucketRegions = props.assetBucketProps.regions;
    const assetBucketPrefix = props.assetBucketProps.prefix;

    // 1. create role
    const provider = GithubActionsIdentityProvider.fromAccount(
      this,
      'GithubProvider',
    );

    // 2. create asset buckets
    const buckets: s3.Bucket[] = [];
    const lifecycleRules: s3.LifecycleRule[] = [];
    if (stage === 'dev') {
      lifecycleRules.push({
        expiration: Duration.days(14),
      });
    }

    for (const assetBucketRegion of assetBucketRegions) {
      const bucket = new s3.Bucket(this, `${assetBucketPrefix}-${assetBucketRegion}`, {
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
      buckets.push(bucket);
    }

    // 3. create release bucket
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

    // 4. grant permissions
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

      for (const bucket of buckets) {
        bucket.grantPut(uploadRole, assetObjectKeysPattern);
      }

      uploadRole.addToPolicy(new iam.PolicyStatement({
        actions: [
          's3:GetBucketLocation',
          's3:ListBucket',
        ],
        resources: buckets.map((bucket) => bucket.bucketArn),
      }));

      new CfnOutput(this, `${roleName}-output`, {
        value: uploadRole.roleArn,
      });
    }

  };
}

// for development, use account/region from cdk cli
const devEnv = {
  account: '123456789012', // -> TODO replace with your account
  region: 'eu-west-2',
};

// TODO for now, we use the same account/region for dev and prod
const prodEnv = {
  account: '123456789012', // -> TODO replace with your account
  region: 'eu-west-2',
};
const app = new App();

const repo1PropsDev = {
  owner: 'your-github-org', // -> TODO replace with your github org
  repo: 'your-repo-1', // -> TODO replace with your repo
  filter: '*',
  assetObjectKeysPattern: 'prefix1/*',
  releaseObjectKeysPattern: 'prefix1/*',
};
const repo1PropsProd = repo1PropsDev;

const repo2PropsDev = {
  owner: 'your-github-org', // -> TODO replace with your github org
  repo: 'your-repo-2', // -> TODO replace with your repo
  filter: '*',
  assetObjectKeysPattern: 'prefix2/*',
  releaseObjectKeysPattern: 'prefix2/*',
};

const repo2PropsProd = repo2PropsDev;

const assetBucketRegions = ['eu-west-1', 'eu-central-1'];

new MyStack(app, 's3-assets-bs-dev', {
  env: devEnv,
  stage: 'dev',
  githubRepoProps: [
    repo1PropsDev,
    repo2PropsDev,
  ],
  assetBucketProps: {
    regions: assetBucketRegions,
    prefix: 'foo-dev-assets', // -> TODO replace with your prefix
  },
  releaseBucketProps: {
    prefix: 'foo-dev', // -> TODO replace with your prefix
  },
});

new MyStack(app, 's3-assets-bs-prod', {
  env: prodEnv,
  stage: 'prod',
  githubRepoProps: [
    repo1PropsProd,
    repo2PropsProd,
  ],
  assetBucketProps: {
    regions: assetBucketRegions,
    prefix: 'foo-prod-assets', // -> TODO replace with your prefix
  },
  releaseBucketProps: {
    prefix: 'foo-prod', // -> TODO replace with your prefix
  },
});

app.synth();