# s3-cdk-assets-bootstrap

Creates the boostrap resources for publishing your cdk construct with assets to public S3 buckets, so others can use them as cloudformation templates.

Does the following:
- Creates S3 asset bucket in the defined regions
- Creates one S3 release bucket for the main template
- Configures IAM roles for the specified GitHub repositories.

See the related blog post [here](https://manuel-vogel.de/posts/2024-03-18-projen-release-s3-workflow/) for more details.

## Install
- Make sure you have the OICD provider created for GitHub via the console. See [here](https://aws.amazon.com/blogs/security/use-iam-roles-to-connect-github-actions-to-actions-in-aws/) how: **Step 1: Create an OIDC provider in your account**
- in the `main.ts` file replace all `TODO replace` with your data
- log into the AWS CLI and then deploy the stack
- Note: you might need to bootstrap each region before via `npx cdk bootstrap 123456789012/$region`
```bash
# deploy role and release bucket
npm run deploy -- s3-assets-bs-dev

# deploy asset buckets per region
for region in eu-west-1 us-east-1 us-west-2 eu-central-1 us-east-2 ca-central-1 ap-northeast-1 ap-southeast-1 ap-southeast-2; do npm run deploy -- s3-assets-bs-$region-dev; end
```
- use the arns of the roles from the output