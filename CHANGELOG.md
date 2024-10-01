# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.2.9] - 2024-10-01

### Security

- Security updates for npm packages

## [4.2.8] - 2024-09-17

### Security

- Security updates for npm packages

## [4.2.7] - 2024-08-22

### Security

- Security updates for npm packages

## [4.2.6] - 2024-08-09

### Security

- Upgraded vulnerable packages

## [4.2.5] - 2024-07-02

### Security

- Security updates for npm packages

## [4.2.4] - 2024-03-29

### Security

- Security updates for npm packages

## [4.2.3] - 2023-10-30

### Security

- Security updates for npm packages

## [4.2.2] - 2023-08-07

### Security

- Updated npm packages
- Upgraded lambda runtimes to NodeJS 18 and AWS SDK v3

### Fixed

- Fixed an issue where anonymized data was sent even when customers opted out

## [4.2.1] - 2023-04-17

### Changed

- Updated object ownership configuration on the CloudFormation logging bucket.
- Updated aws-cloudfront-s3 construct to support new bucket ACL changes.

## [4.2.0] - 2023-04-10

### Added

- Converted project from CDK 1 to CDK 2 project.

### Changed

- Upgraded multiple nodejs packages to improve security.
- Upgraded Lambda runtimes to node 18 from node 12.
- Added region name to CachePolicy to allow unique name for multiple stacks with the same stack name in different regions.
- Removed application insights
- MediaPackage IAM role more secure with scoped down privlages.

### Contributors

- @eggoynes

## [4.1.0] - 2022-11-09

### Added

- Added Service Catalog AppRegistry Application resource
- Added Application Insights within the AppRegistry dashboard

### Changed

- Added stack name to CachePolicy to make unique name allowing for multiple concurrent stacks
- Added stack name to AppRegistry application name to allow for multiple concurrent stacks

## [4.0.1] - 2022-08-03

### Added

- Added Service Catalog AppRegistry Application resource

### Changed

- Disabled versioning on buckets within the CloudFront to S3 construct

## [4.0.0] - 2022-07-06

### Added

- Added cdk infrastructure in source/constructs directory
- Defined resources for cdk stack in source/constructs/lib/live-streaming.ts
- Added links to MediaLive and S3 consoles to CloudFormation Outputs
- Added links to metric dashboards for MediaLive and MediaPackage to CloudFormation Outputs
- Added SonarQube properties file: sonar-project.properties
- Added snapshot test to source/constructs/test directory
- Added cdk nag rule suppressions
- Added SolutionId tag to resources

### Changed

- Removed CloudFormation template live-streaming-on-aws.yaml
- Use CachePolicy instead of ForwardedValues(deprecated) for cloudfront distribution
- Use @aws-solutions-constructs/aws-cloudfront-s3 construct to deploy demo resources
- Updated deployment/run-unit-tests.sh to generate unit test coverage reports
- Updated deployment/build-s3-dist.sh to output cdk nag errors
- Updated source/custom-resource/lib/medialive/index.spec.js to increase unit test coverage
- Generate secret string for Cdn Secret resource using cdk instead of hard coding
- Upgrade path from old versions require a delete and re-deploy since moving to CDK

### Contributors

- @sandimciin
- @eggoynes

## [3.1.1] - 2022-01-24

### Changed

- Follow Redirects updated to 1.14.7
- AWS SDK updated to 2.814.0
- Architecture diagram updated

## [3.1.0] - 2021-11-12

### Changed

- Added additional permissions for AWS MediaLive IAM Policy. Now has CloudWatch, MediaConnect, and MediaStore access.
- Changed case of IAM policy <https://github.com/aws-solutions/live-stream-on-aws/pull/19>

### Changed

- Axios update to 0.21.2
- Tmpl update to 1.0.5

### Fixed

- Add new Permissions to the CloudFormation template that will allow customers to add tags on EML resources.

## [3.0.0] - 2020-08-05

### Changed

- The AWS MediaLive default CloudFormation parameter for channel start has been changed to false.

### Changed

- The Amazon CloudFront distribution TTL values were modified to 1 second for all http error codes. 403, 404, 405, 500, 501, 503, and 504.
- Updated packages glob-parent, ssri, y18n, react-dev-utils, elliptic, axios, and others.

### Fixed

- Readme file updates.
- Removed Lambda from logging AWS MediaLive input details which could contain passwords.

## [2.3.0] - 2019-10-30

### Added

- CHANGELOG version 2.3.0 release
- Lambda runtime update from Node8.10 to Node12.x, Python3.6 to Python3.8
- Demo Console deployed by default, previously an optional through cfn parameter but disabling teh console caused the stack to fail.

## [2.4.0] - 2020-07-30

### Added

- Origin headers and Custom Error 404 TTL for CloudFront
- CDN Authorization for Elemental MediaPackage EndPoints

### Changed

- MediaLive Encoding now supports QVBR and 4 second segment sizes
- MediaLive with a new set of outputs 1920x1080, 1280x720, 960x540, 768x432, 640x360, 512x288

### Removed

- discontinued support for the python version of the CloudFormation custom resource.
