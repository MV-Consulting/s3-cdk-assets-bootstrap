import {
  App,
} from 'aws-cdk-lib';
import { AssetsBucketStack } from './stacks/AssetsBucketStack';
import { assetBucketRegions } from './stacks/common';
import { DistributionStack } from './stacks/DistributionStack';

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

////////////////// DEVELOPMENT //////////////////
// for development, use account/region from cdk cli
const devEnv = {
  account: '123456789012',
  region: 'eu-central-1',
};

const devDistributionStack = new DistributionStack(app, 's3-dist-bs-dev', {
  env: devEnv,
  stage: 'dev',
  devRetentionDays: 14,
  githubRepoProps: [
    repo1PropsDev,
    repo2PropsDev,
  ],
  releaseBucketProps: {
    prefix: 'foo-dev',
  },
});

for (const region of assetBucketRegions) {
  new AssetsBucketStack(app, `s3-assets-bs-${region}-dev`, {
    env: {
      account: devEnv.account,
      region: region,
    },
    stage: 'dev',
    devRetentionDays: 14,
    prefix: 'foo-dev-assets',
    region: region,
    uploadRoleConfigs: devDistributionStack.uploadRoleConfigs,
  });
}

////////////////// PRODUCTION //////////////////
// for now, we use the same account/region for dev and prod
const prodEnv = devEnv;
const prodDistributionStack = new DistributionStack(app, 's3-dist-bs-prod', {
  env: prodEnv,
  stage: 'prod',
  githubRepoProps: [
    repo1PropsProd,
    repo2PropsProd,
  ],
  releaseBucketProps: {
    prefix: 'foo-prod',
  },
});

for (const region of assetBucketRegions) {
  new AssetsBucketStack(app, `s3-assets-bs-${region}-prod`, {
    env: {
      account: prodEnv.account,
      region: region,
    },
    stage: 'prod',
    prefix: 'foo-prod-assets',
    region: region,
    uploadRoleConfigs: prodDistributionStack.uploadRoleConfigs,
  });
}

app.synth();
