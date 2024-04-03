import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DistributionStack } from '../src/stacks/DistributionStack';

test('Snapshot', () => {
  const app = new App();

  const distributionStack = new DistributionStack(app, 'test', {
    stage: 'dev',
    githubRepoProps: [
      {
        owner: 'owner',
        repo: 'repo',
        filter: 'filter',
        assetObjectKeysPattern: 'assetObjectKeysPattern',
        releaseObjectKeysPattern: 'releaseObjectKeysPattern',
      },
    ],
    releaseBucketProps: {
      prefix: 'prefix',
    },
  });

  const templateDistribution = Template.fromStack(distributionStack);
  expect(templateDistribution.toJSON()).toMatchSnapshot();
});