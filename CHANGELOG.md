# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2020-8-5
### Added 
- Added 

### Changed
- The AWS MediaLive channel defaults to false. So a customer has to enable this option for MediaLive to start. 

### Updated
- The Amazon CloudFront distribution TTL values were modified to 1 second for all http error codes. 403, 404, 405, 500, 501, 503, and 504.

### Fixed
- Readme file updates.
- Removed Lambda from logging MediaPackage input details. 

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
