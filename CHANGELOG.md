# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2021-11-12
### Changed
- Added additional permissions for AWS MediaLive Policy. Now has additional CloudWatch, MediaConnect, and MediaStore access. 
- Changed case of IAM policy (https://github.com/aws-solutions/live-stream-on-aws/pull/19)

### Updated
- Axios update to 0.21.2
- Tmpl update to 1.0.5

### Fixed
- Add new Permissions to the CloudFormation template that will allow customers to add tags on EML resources. 

## [3.0.0] - 2020-8-5
### Changed
- The AWS MediaLive default CloudFormation parameter for channel start has been changed to false. 

### Updated
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
- CDN Autnorizarion for Elemental MediaPackage EndPoints
### Updated
- MediaLive Encoding now supports QVBR and 4 second segment sizes
- MediaLive with a new set of outputs 1920x1080, 1280x720, 960x540, 768x432, 640x360, 512x288
### Removed
- discontinued support for the python version of the CloudFormation custom resource.
