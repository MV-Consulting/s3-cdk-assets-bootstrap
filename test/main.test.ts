import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MyStack } from '../src/main';

test('Snapshot', () => {
  const app = new App();
  const stack = new MyStack(app, 'test', {
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
    assetBucketProps: {
      regions: ['eu-west-1', 'eu-central-1'],
      prefix: 'prefix',
    },
    releaseBucketProps: {
      prefix: 'prefix',
    },
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});