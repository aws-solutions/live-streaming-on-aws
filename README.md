# Live Streaming on AWS

How to implement Live streaming on AWS  at scale leveraging AWS Elemental MediaLive,  MediaPackage and Amazon CloudFront. This repo contains the source code for the AWS solution [Live Streaming on AWS](https://aws.amazon.com/solutions/implementations/live-streaming-on-aws/?did=sl_card&trk=sl_card).

## Architecture Overview

![Architecture](architecture.png)

**AWS Elemental MediaLive**<br/>
Is configured to ingest 2 live feeds and transcode the content into multiple adaptive bitrate HLS content.  The solution can be configured to ingest RTP RTMP HLS and MediaConnect streams and will apply 1 of 3 encoding profiles which include bitrates of 1080p through 270p. The encoding profile is set at launch and is based on the source resolution (See Encoding Profiles below).

**AWS Elemental MediaPackage**<br/>
Ingests the MediaLive Output and package the Live stream into HLS, DASH, and CMAF formats that are delivered through 3 MediaPackage custom endpoints.

**Amazon CloudFront**<br/>
Is configured with the MediaPackage custom endpoints as the Origins for the distribution. CloudFront then enable the live stream content to be delivered globally and at scale.

**Optional Demo Deployment**<br/>
As part of the CloudFormation template a Demo HTML preview player is deployed to an Amazon S3 bucket which is a single page HTML/JavaScript application that will playback the HLS, DASH, MSS and CMAF streams. In addition, the solution can be configured to ingest a Demo HLS feed hosted on AWS.   


## Deployment
The solution is deployed using a CloudFormation template with a lambda backed custom resource, available in both NodeJS and Python.
For details on deploying the solution please see the details on the Solution home page:  [Live Streaming on AWS](https://aws.amazon.com/solutions/implementations/live-streaming-on-aws)

## Encoding Profiles
To solution Configures AWS Elemental MediaLive with one of three encoding profiles based on the source resolution defined at launch as a CloudFormation parameter. The three options are 1080, 720, 540 and correspond to the following encoding profiles:

* HD-1080p profile: 1920x1080, 1280x720, 960x540, 768x432, 640x360, 512x288
* HD-720p profile: 1280x720, 960x540, 768x432, 640x360, 512x288
* SD-540p profile:  960x540, 768x432, 640x360, 512x288

The profiles are defined in JSON and and can be found in:
```
  source/custom-resource/lib/medialive/encoding-profiles/
```

## Source code

**source/custom-resources::**<br/>
A NodeJS based  Lambda function used as a custom resource for deploying MediaLive and MediaPackage resources through CloudFormation.

## Creating a custom build
The solution can be deployed through the CloudFormation template available on the solution [home page](https://aws.amazon.com/solutions/implementations/live-streaming-on-aws/). The Following steps are required to customize and deploy your own version of the solution:

1. download or clone this repo, 
2. update the source code with any changes you require
3. run the deployment/build-s3-dist.sh script to package the lambda source code and update the s3 bucket mappings in the CloudFormation template (see bellow).
4. upload lambda deployment package to Amazon S3
5. deploy the CloudFormation template.


## Example Custom Deployment.
The CloudFormation template is configured to pull the source code from Amazon S3 bucket in the same region the template is being launched in. The template includes the following mappings for the source code:

```
  SourceCode:
    General:
      S3Bucket: CODE_BUCKET //This is the name of the S3 bucket
      KeyPrefix: SOLUTION_NAME/CODE_VERSION //This is the path to the source code (eg: live-streaming-on-aws/v2.3.0)
```

The example bellow assumes the following:
* The solution is going to be deployed to us-east-1
* the bucket name is mybucket-us-east-1
* the solution name is live streaming-on-aws
* the version is v2.3.0


### Prerequisites:
* [AWS Command Line Interface](https://aws.amazon.com/cli/)
* Node.js 12.x or later

### 1. Create an Amazon S3 Bucket
 Create a bucket in us-east-1 region with the region appended to the name:

```
aws s3 mb s3://mybucket-us-east-1
```

### 2. Create the deployment packages
Run the build-s3-dist.sh script passing in 3 parameters for CODE_BUCKET, SOLUTION_NAME, CODE_VERSION:

```
cd deployment/ && chmod +x ./build-s3-dist.sh
./build-s3-dist.sh mybucket live-streaming-on-aws v2.3.0
```

**note** 
The template adds the -region suffix to any referrence to the bucket, this allows the same template to be deployed to multiple regions. For example the cusntom Resource Lambda function has the follwing:

```
S3Bucket: !Join ["-", [!FindInMap ["SourceCode", "General", "S3Bucket"], Ref: "AWS::Region"]]
```

### 3. Deploy the source code to S3:
```
aws s3 sync ./regional-s3-assets/ s3://mybucket-us-east-1/live-streaming-on-aws/v2.3.0/
```

### 4. Launch the CloudFormation template.
The buid-s3-dist.sh script creates a copy of the template in deployment/global-assets/ with the Mappins section updated with you s3 details:

  SourceCode:
    General:
      S3Bucket: mybucket
      KeyPrefix: live-streaming-on-aws/v2.3.0

Launch the Template through the AWS Console in us-east-1.


## License

* This project is licensed under the terms of the Apache 2.0 license. See `LICENSE`.