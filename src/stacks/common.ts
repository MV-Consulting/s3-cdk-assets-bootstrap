import {
  aws_iam as iam,
} from 'aws-cdk-lib';

export interface UploadRolesConfig {
  uploadRole: iam.Role;
  assetObjectKeysPattern: string;
}

export const assetBucketRegions = [
  'us-east-1', // US East (N. Virginia),
  'eu-west-1', // Europe (Ireland),
  'us-west-2', // US West (Oregon),
  // new regions since 2023-09 for SES
  'eu-central-1', // Europe (Frankfurt),
  // 'eu-west-2', // Europe (London),
  'us-east-2', // US East (Ohio),
  'ca-central-1', // Canada (Central),
  'ap-northeast-1', // Asia Pacific (Tokyo),
  'ap-southeast-1', // Asia Pacific (Singapore),
  'ap-southeast-2', // Asia Pacific (Sydney),
];