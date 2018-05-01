Live Streaming on aws

How to implement a Live stream on AWS  at scale leveraging AWS Elemental MediaLive and MediaPackage.


Source code for the AWS solution [Live Streaming on AWS](https://aws.amazon.com/answers/media-entertainment/live-streaming-on-aws/).


## deployment/live-streaming-on-aws.yaml
The solution is deployed using a single CloudFromation template.

## source/ Lambda source code node.js 6.10:

**source/custom-resources**:
A series of CloudFormation custom resources used to deploy the solution include AWS Elemental MediaLive and MediaPackage.

**source/console**:
A single page application used to demo playback of the live stream.

**source/media-live**:
A lambd function used to trigger (stop/start) the MediaLive Channel and initiate the live encoding.

## Building the Lambda Packages
We recommend building this package on Amazon Linux because the target Lambda environment will run on Amazon Linux.

```bash
cd deployment
./build-s3-dist.sh source-bucket-base-name
```
source-bucket-base-name should be the base name for the S3 bucket location where the template will source the Lambda code from.
The template will append '-[region_name]' to this value.
For example: ./build-s3-dist.sh solutions
The template will then expect the source code to be located in the solutions-[region_name] bucket

## CF template and Lambda functions
Located in deployment/dist after running build-s3-dist.sh


***

Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
