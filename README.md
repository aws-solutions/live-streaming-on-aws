# Live Streaming on AWS

How to implement Live streaming on AWS  at scale leveraging AWS Elemental MediaLive,  MediaPackage and Amazon CloudFront. This repo contains the source code for the AWS solution [Live Streaming on AWS](https://aws.amazon.com/answers/media-entertainment/live-streaming-on-aws/).

## Architecture Overview

![Architecture](architecture.png)

**AWS Elemental MediaLive**<br/>
Is configured to ingest 2 live feeds and transcode the content into multiple adaptive bitrate HLS content.  The solution can be configured to ingest RTP RTMP and HLS streams and will apply 1 of 3 encoding profiles which include bitrates of 1080p through 270p. The encoding profile is set at launch and is based on the source resolution (See Encoding Profiles below).

**AWS Elemental MediaPackage**<br/>
Ingests the MediaLive Output and package the Live stream into HLS, DASH and MSS formats that are delivered through 3 MediaPackage custom endpoints.

**Amazon CloudFront**<br/>
Is configured with the three MediaPackage custom endpoints as the Origins for the distribution. CloudFront then enable the live stream content to be delivered globally and at scale.

**Optional Demo Deployment**<br/>
As part of the CloudFormation template a Demo HTML preview player is deployed to an Amazon S3 bucket which is a single page HTML/JavaScript application that will playback the HLS, DASH and MMS streams. In addition, the solution can be configured to ingest a Demo HLS feed hosted on AWS.   


## Deployment
The solution is deployed using a CloudFormation template with a lambda backed custom resource, available in both NodeJS and Python.
For details on deploying the solution please see the details on the Solution home page:  [Live Streaming on AWS](https://aws.amazon.com/answers/media-entertainment/live-streaming-on-aws/)

## Encoding Profiles
To solution Configures AWS Elemental MediaLive with one of three encoding profiles based on the source resolution defined at launch as a CloudFormation parameter. The three options are 1080, 720, 540 and correspond to the following encoding profiles:

**1080p Profile::**<br/>
1080p@6500kbps, 720p@5000kbps, 720p@3300kbps, 540p@2000kbps, 432p@1200kbps, 360p@800kbps, 270@400kbps, 234p@200kbps.

**720p Profile::**<br/>
720p@5000kbps, 720p@3300kbps, 540p@2000kbps, 432p@1200kbps, 360p@800kbps, 270@400kbps, 234p@200kbps.

**540p Profile::**<br/>
 540p@2000kbps, 432p@1200kbps, 360p@800kbps, 270@400kbps, 234p@200kbps.

The profiles are defined in JSON and and can be found in:
```
  source/custom-resource-js/lib/medialive/encoding-profiles/
  source/custom-resource-py/encoding-profiles/
```

## Source code

**source/custom-resources-js::**<br/>
A NodeJS based  Lambda function used as a custom resource for deploying MediaLive and MediaPackage resources through CloudFormation.

**source/custom-resources-py::**<br/>
A Python based  Lambda function used as a custom resource for deploying MediaLive and MediaPackage resources through CloudFormation.

**source/console::**<br/>
A single page application used to demo playback of the live stream. This is deployed to an AWS S3 bucket as part of the CloudFormation deployment.


## Creating a custom Build
To solution can be deployed through the CloudFormation template available on the solution home page: [Live Streaming on AWS](https://aws.amazon.com/answers/media-entertainment/live-streaming-on-aws/).
 To make changes to the solution, download or clone this repo, update the source code and then run the deployment/build-s3-dist.sh script to deploy the updated Lambda code to an S3 bucket in your account.

### Pre-requirements:
* [AWS Command Line Interface](https://aws.amazon.com/cli/)
* Node.js 8.x or Python 3.x

### 1. Create an Amazon S3 Bucket.
The CloudFormation template is configured to pull the Lambda deployment packages from Amazon S3 bucket in the region the template is being launched in. Create a bucket in the desired region with the region name appended to the name of the bucket. eg: for us-east-1 create a bucket named: ```bucket-us-east-1```

### 2. Create the deployment packages:
Run the build-s3-dist.sh script, passing in 2 variables:
* CODEBUCKET = the name of the S3 bucket (do NOT include the -region extension)
* CODEVERSION = this will be the subfolder containing the code.

This will:
* copies the console files to ./deployment/dist/.
* copies the CloudFormation template to ./deployment/dist/ and updates the source code mappings.
* zips and copies the source code to ./deployment/dist/

Example:
```
  cd deployment/
  ./build-s3-dist.sh bucket 1.01
```
 This will deploy the source code to:
```
  s3://bucket-us-east-1/live-streaming-on-aws/1.01/.
```
And update the CloudFormation template mappings:
```
  SourceCode:
    General:
      S3Bucket: bucket
      KeyPrefix: live-streaming-on-aws/1.01
```

 ### 3. Upload the Code to Amazon S3.

Use the AWS CLI to sync the lambda code and demo console files to amazon S3:

 ```
   cd deployment/
   aws s3 sync .dist/ s3://bucket-us-east-1/live-streaming-on-aws/1.01/.
 ```

 ### 4. Launch the CloudFormation template.

Launch the updated CloudFormation template from ```deployment/dist/``` folder.


***

Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
