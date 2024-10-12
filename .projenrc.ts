import { awscdk } from 'projen';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 's3-cdk-assets-bootstrap',
  projenrcTs: true,
  description: 'A CDK app that creates your public S3 buckets in all regions.',

  deps: [
    'aws-cdk-github-oidc@v2.4.1',
  ],
  autoApproveOptions: {
    allowedUsernames: ['mavogel'],
  },
  autoApproveUpgrades: true,
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['auto-approve'],
    },
  },
});
project.synth();