# Live Streaming on AWS

How to implement Live streaming on AWS  at scale leveraging AWS Elemental MediaLive,  MediaPackage and Amazon CloudFront. This repo contains the source code for the AWS solution [Live Streaming on AWS](https://aws.amazon.com/answers/media-entertainment/live-streaming-on-aws/).

## Architecture Overview

![Architecture](architecture.png)

## Deployment
The solution is deployed using a CloudFormation template with a lambda backed custom resource which is available in both NodeJS and Python.
For details on deploying the solution please see the details on the Solution home page:  [Live Streaming on AWS](https://aws.amazon.com/answers/media-entertainment/live-streaming-on-aws/)

## Source code

The AWS Lambda source code is available in node.js 8.10 and Python 3.6

**source/custom-resources-js:** \
A NodeJS based  Lambda function used as a custom resource for deploying MediaLive and MediaPackage resources through CloudFormation.

**source/custom-resources-py:** \
A Python based  Lambda function used as a custom resource for deploying MediaLive and MediaPackage resources through CloudFormation.

**source/console**: \
A single page application used to demo playback of the live stream. This is deployed to an AWS S3 bucket as part of the CloudFormation deployment.


## Creating a custom Build
To solution can be deployed through the CloudFormation template available on the solution home page: [Live Streaming on AWS](https://aws.amazon.com/answers/media-entertainment/live-streaming-on-aws/).
 To make changes to the solution, download or clone this repo, update the source code and then run the deployment/build-s3-dist.sh script to deploy the updated Lambda code to an S3 bucket in your account:

### Pre-requirements:
* [AWS Command Line Interface](https://aws.amazon.com/cli/)
* Node.js 8.x

### 1. Create the deployment packages:
run the build-s3-dist.sh script passing in 2 variables:

* CODEBUCKET = the name of the S3 bucket (do NOT include the -region extension, this is added by the CloudFormation template).
* CODEVERSION = this will be the subfolder containing the Lambda deployment packages.

This script create a dist/ folder with an updated copy of the CloudFormation template and the Lambda deployment packages.

#### Example:

To deploy the code to us-east-1 create a bucket in S3,  **bucket-us-east-1**  then run the build script:

```
  cd deployment/
  ./build-s3-dist.sh bucket 1.01
```

 This will deploy the source code th  s3://bucket-us-east-1/live-streaming-on-aws/1.01/.


 ### 2. Upload the Code to Amazon S3 :
 Use the AWS CLI to sync the lambda code and demo console files to amazon S3.

 #### Example

 ```
 aws s3 sync .dist/ s3://bucket-us-east-1/live-streaming-on-aws/1.01/.
 ```

 ### 3. Launch the CloudFormation template.

Launch the updated CloudFormation template from the dist/ folder. This copy of the template has the updated source code mappings.

#### Example:

```
Mappings:
  SourceCode:
    General:
      S3Bucket: bucket
      KeyPrefix: live-streaming-on-aws/1.01

```

***

Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
