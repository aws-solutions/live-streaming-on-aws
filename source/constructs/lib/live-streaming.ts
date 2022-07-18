/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import { Secret } from '@aws-cdk/aws-secretsmanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origin from '@aws-cdk/aws-cloudfront-origins';
import * as appreg from '@aws-cdk/aws-servicecatalogappregistry';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
import { NagSuppressions } from 'cdk-nag';

export class LiveStreaming extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    /**
     * CloudFormation Template Descrption
     */
    this.templateOptions.description = '(SO0013) Live Streaming on AWS Solution %%VERSION%%';
    /**
       * Cfn Parameters
       */
    const inputType = new cdk.CfnParameter(this, 'InputType', {
      type: 'String',
      description: 'Specify the input type for MediaLive. Detailed instructions for each input type can be found here https://docs.aws.amazon.com/solutions/latest/live-streaming-on-aws/appendix-a.html',
      allowedValues: ['RTP_PUSH', 'RTMP_PUSH', 'RTMP_PULL', 'URL_PULL', 'MEDIACONNECT'],
      default: 'URL_PULL'
    });
    const encodingProfile = new cdk.CfnParameter(this, 'EncodingProfile', {
      type: 'String',
      description: 'Select an encoding profile. HD 1080p [1920x1080, 1280x720, 960x540, 768x432, 640x360, 512x288] HD 720p [1280x720, 960x540, 768x432, 640x360, 512x288] SD 540p [960x540, 768x432, 640x360, 512x288]  See the implementation guide for details https://docs.aws.amazon.com/solutions/latest/live-streaming/considerations.html',
      default: 'HD-720p',
      allowedValues: ['HD-1080p', 'HD-720p', 'SD-540p']
    });
    const inputCIDR = new cdk.CfnParameter(this, 'InputCIDR', {
      type: 'String',
      description: 'For RTP and RTMP PUSH input types ONLY, specify the CIDR Block for the MediaLive SecurityGroup. Input security group restricts access to the input and prevents unauthorized third parties from pushing content into a channel that is associated with that input.',
      default: ''
    });
    const priPullUrl = new cdk.CfnParameter(this, 'PriPullUrl', {
      type: 'String',
      description: 'For URL_PULL and RTMP_PULL input types ONLY, specify the primary source URL.',
      default: 'https://d15an60oaeed9r.cloudfront.net/live_stream_v2/sports_reel_with_markers.m3u8'
    });
    const priPullUser = new cdk.CfnParameter(this, 'PriPullUser', {
      type: 'String',
      description: 'For URL_PULL and RTMP_PULL input types ONLY, specify a username for the primary source URL if basic authentication is enabled on the source.',
      default: ''
    });
    const priPullPass = new cdk.CfnParameter(this, 'PriPullPass', {
      type: 'String',
      description: 'For URL_PULL and RTMP_PULL input types ONLY, specify a password for the primary source URL if basic authentication is enabled on the source.',
      default: '',
      noEcho: true
    });
    const secPullUrl = new cdk.CfnParameter(this, 'SecPullUrl', {
      type: 'String',
      description: 'For URL_PULL and RTMP_PULL input types ONLY, specify the secondary source URL, this should be a HTTP or HTTPS link to the stream manifest file.',
      default: 'https://d3h5srgm8b0t83.cloudfront.net/live_stream_v2/sports_reel_with_markers.m3u8'
    });
    const secPullUser = new cdk.CfnParameter(this, 'SecPullUser', {
      type: 'String',
      description: 'For URL_PULL and RTMP_PULL input types ONLY, specify a username for the secondary source URL if basic authentication is enabled on the source.',
      default: ''
    });
    const secPullPass = new cdk.CfnParameter(this, 'SecPullPass', {
      type: 'String',
      description: 'For URL_PULL and RTMP_PULL input types ONLY, specify a password for the secondary source URL if basic authentication is enabled on the source.',
      default: '',
      noEcho: true
    });
    const priMediaConnectArn = new cdk.CfnParameter(this, 'PriMediaConnectArn', {
      type: 'String',
      description: 'For MediaConnect Input type ONLY, specify the ARN for MediaConnect as the primary source. This flow has to be in a different availability zone as the secondary source.',
      default: ''
    });
    const secMediaConnectArn = new cdk.CfnParameter(this, 'SecMediaConnectArn', {
      type: 'String',
      description: 'For MediaConnect Input type ONLY, specify the ARN for MediaConnect as the secondary source. This flow has to be in a different availability zone as the primary source.',
      default: ''
    });
    const channelStart = new cdk.CfnParameter(this, 'ChannelStart', {
      type: 'String',
      description: 'If your source is ready to stream, select true. This will start the MediaLive Channel as part of the deployment. If you select false, you will need to manually start the MediaLive Channel when your source is ready.',
      default: 'No',
      allowedValues: ['Yes', 'No']
    });
    /**
         * Template metadata
         */
    this.templateOptions.metadata = {
      'AWS::CloudFormation::Interface': {
        ParameterGroups: [
          {
            Label: { default: 'LIVE STREAM SOURCE' },
            Parameters: [inputType.logicalId]
          },
          {
            Label: { default: 'URL_PULL and RTMP_PULL CONFIGURATION' },
            Parameters: [priPullUrl.logicalId, priPullUser.logicalId, priPullPass.logicalId, secPullUrl.logicalId, secPullUser.logicalId, secPullPass.logicalId]
          },
          {
            Label: { default: 'RTP_PUSH / RTMP_PUSH CONFIGURATION' },
            Parameters: [inputCIDR.logicalId]
          },
          {
            Label: { default: 'MEDIACONNECT CONFIGURATION' },
            Parameters: [priMediaConnectArn.logicalId, secMediaConnectArn.logicalId]
          },
          {
            Label: { default: 'ENCODING OPTIONS' },
            Parameters: [encodingProfile.logicalId, channelStart.logicalId]
          }
        ],
        ParameterLabels: {
          InputType: {
            default: 'Source Input Type'
          },
          EncodingProfile: {
            default: 'Encoding Profile'
          },
          InputCIDR: {
            default: 'Input CIDR Block'
          },
          PriPullUrl: {
            default: 'Primary Source URL'
          },
          PriPullUser: {
            default: 'Primary Source Username'
          },
          PriPullPass: {
            default: 'Primary Source Password'
          },
          SecPullUrl: {
            default: 'Secondary Source URL'
          },
          SecPullUser: {
            default: 'Secondary Source Username'
          },
          SecPullPass: {
            default: 'Secondary Source Password'
          },
          PriMediaConnectArn: {
            default: 'Primary MediaConnect Arn'
          },
          SecMediaConnectArn: {
            default: 'Secondary MediaConnect Arn'
          },
          ChannelStart: {
            default: 'Start MediaLive Channel'
          }
        }
      }
    };
    /**
     * Mapping for sending anonymous metrics to AWS Solution Builders API
     */
    new cdk.CfnMapping(this, 'AnonymousData', { // NOSONAR
      mapping: {
        SendAnonymousData: {
          Data: 'Yes'
        }
      }
    });



    /**
     * IAM: MediaLive Role and Policy
     */
    const mediaLiveRole = new iam.Role(this, 'MediaLiveRole', {
      assumedBy: new iam.ServicePrincipal('medialive.amazonaws.com'),
    });
    const mediaLivePolicy = new iam.Policy(this, 'MediaLivePolicy', {
      statements: [
        new iam.PolicyStatement({
          resources: [`arn:${cdk.Aws.PARTITION}:mediastore:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`],
          actions: [
            'mediastore:DeleteObject',
            'mediastore:DescribeObject',
            'mediastore:GetObject',
            'mediastore:ListContainers',
            'mediastore:PutObject'
          ]
        }),
        new iam.PolicyStatement({
          resources: [`arn:${cdk.Aws.PARTITION}:mediaconnect:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`],
          actions: [
            'mediaconnect:ManagedDescribeFlow',
            'mediaconnect:ManagedAddOutput',
            'mediaconnect:ManagedRemoveOutput'
          ]
        }),
        new iam.PolicyStatement({
          resources: [`arn:${cdk.Aws.PARTITION}:ec2:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`],
          actions: [
            'ec2:DescribeSubnets',
            'ec2:DescribeNetworkInterfaces',
            'ec2:CreateNetworkInterface',
            'ec2:CreateNetworkInterfacePermission',
            'ec2:DeleteNetworkInterface',
            'ec2:DeleteNetworkInterfacePermission',
            'ec2:DescribeSecurityGroups'
          ]
        }),
        new iam.PolicyStatement({
          resources: [`arn:${cdk.Aws.PARTITION}:logs:*:*:*`],
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
            'logs:DescribeLogGroups'
          ]
        }),
        new iam.PolicyStatement({
          resources: [`arn:${cdk.Aws.PARTITION}:mediapackage:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:channels/*`],
          actions: [
            'mediapackage:DescribeChannel'
          ]
        })
      ]
    });
    mediaLivePolicy.attachToRole(mediaLiveRole);

    //cdk_nag
    NagSuppressions.addResourceSuppressions(
      mediaLivePolicy,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Resource ARNs are not generated at the time of policy creation'
        }
      ]
    );


    /**
     * IAM: MediaPackage Role
     */
    const mediaPackageRole = new iam.Role(this, 'MediaPackageRole', {
      assumedBy: new iam.ServicePrincipal('mediapackage.amazonaws.com'),
    });


    /**
     * IAM: CustomResource lambda role & policy
     * Lambda: lambda function used to create custom resources
     */
     const customResourceRole = new iam.Role(this, 'CustomResourceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    const customResourcePolicy = new iam.Policy(this, 'CustomResourcePolicy', {
      statements: [
        new iam.PolicyStatement({
          resources: [`arn:${cdk.Aws.PARTITION}:medialive:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`],
          actions: [
            'medialive:DescribeInputSecurityGroup',
            'medialive:CreateInputSecurityGroup',
            'medialive:DescribeInput',
            'medialive:CreateInput',
            'medialive:DeleteInput',
            'medialive:StopChannel',
            'medialive:CreateChannel',
            'medialive:DeleteChannel',
            'medialive:DeleteInputSecurityGroup',
            'medialive:DescribeChannel',
            'medialive:StartChannel',
            'medialive:CreateTags',
            'medialive:DeleteTags'
          ]
        }),
        new iam.PolicyStatement({
          resources: [`arn:${cdk.Aws.PARTITION}:mediapackage:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`],
          actions: [
            'mediapackage:CreateChannel',
            'mediapackage:DeleteChannel',
            'mediapackage:ListOriginEndpoints',
            'mediapackage:DeleteOriginEndpoint',
            'mediapackage:CreateOriginEndpoint',
            'mediapackage:TagResource',
            'mediapackage:UntagResource'
          ]
        }),
        new iam.PolicyStatement({
          resources: [`arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/*`],
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ]
        }),
        new iam.PolicyStatement({
          resources: [`arn:${cdk.Aws.PARTITION}:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/*`],
          actions: [
            'ssm:PutParameter'
          ]
        }),
        new iam.PolicyStatement({
          resources: [mediaLiveRole.roleArn],
          actions: ['iam:PassRole']
        }),
        new iam.PolicyStatement({
          resources: [mediaPackageRole.roleArn],
          actions: ['iam:PassRole']
        })
      ]
    });
    customResourcePolicy.attachToRole(customResourceRole);

    //cdk_nag
    NagSuppressions.addResourceSuppressions(
      customResourcePolicy,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Resource ARNs are not generated at the time of policy creation'
        }
      ]
    );

    const customResourceLambda = new lambda.Function(this, 'CustomResource', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      description: 'Used to deploy custom resources and send AnonymousData',
      environment: {
        SOLUTION_IDENTIFIER: 'AwsSolution/SO0013/%%VERSION%%'
      },
      code: lambda.Code.fromAsset('../custom-resource'),
      role: customResourceRole,
      timeout: cdk.Duration.seconds(30)
    });
    customResourceLambda.node.addDependency(customResourceRole);
    customResourceLambda.node.addDependency(customResourcePolicy);
    /** get the cfn resource for the role and attach cfn_nag rule */
    (customResourceLambda.node.findChild('Resource') as lambda.CfnFunction).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [{
          id: 'W58',
          reason: 'Invalid warning: function has access to cloudwatch'
        }, {
          id: 'W89',
          reason: 'This CustomResource does not need to be deployed inside a VPC'
        }, {
          id: 'W92',
          reason: 'This CustomResource does not need to define ReservedConcurrentExecutions to reserve simultaneous executions'
        }]
      }
    };

    


    /**
     * IAM: MediaPackage Policy
     * Secrets Manager: CDN Identifier
     * Custom Resource: UUID
     */
    const uuid = new cdk.CustomResource(this, 'UUID', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'UUID'
      }
    });

    const cdnSecret = new Secret(this, 'CdnSecret', {
      description: `CDN authorization string value for ${cdk.Aws.STACK_NAME} Live Streaming Deployment`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ MediaPackageCDNIdentifier: uuid.getAttString('UUID') }),
        generateStringKey: 'password'
      }
    });
    /** get the cfn resource and attach cfn_nag rule */
    (cdnSecret.node.defaultChild as cdk.CfnResource).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: 'W77',
            reason: 'Using default keys as this is uuid and not a password. MediaPackage CDN Authorization: https://docs.aws.amazon.com/mediapackage/latest/ug/setting-up-create-trust-rel-policy-cdn.html'
          }
        ]
      }
    };
    //cdk_nag
    NagSuppressions.addResourceSuppressions(
      cdnSecret,
      [
        {
          id: 'AwsSolutions-SMG4',
          reason: 'MediaPackage requires a static value and is not integrated with CDN for automatic rotation: https://docs.aws.amazon.com/mediapackage/latest/ug/cdn-auth-setup.html#cdn-aut-setup-cdn'
        }
      ]
    );

    const mediaPackagePolicy = new iam.Policy(this, 'MediaPackagePolicy', {
      statements: [
        new iam.PolicyStatement({
          resources: [cdnSecret.secretArn],
          actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
            'secretsmanager:ListSecrets',
            'secretsmanager:ListSecretVersionIds'
          ]
        }),
        new iam.PolicyStatement({
          resources: ['*'],
          actions: [
            'iam:GetRole',
            'iam:PassRole'
          ]
        })
      ]
    });
    /** get the cfn resource for the policy and attach cfn_nag rule */
    (mediaPackagePolicy.node.defaultChild as cdk.CfnResource).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: 'F39',
            reason: 'Resource level permission is not supported by getRole'
          }, {
            id: 'W12',
            reason: '* is required for MediaPackage CDN Authorization: https://docs.aws.amazon.com/mediapackage/latest/ug/setting-up-create-trust-rel-policy-cdn.html'
          }
        ]
      }
    };
    //cdk_nag
    NagSuppressions.addResourceSuppressions(
      mediaPackagePolicy,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: '* is required for MediaPackage CDN Authorization: https://docs.aws.amazon.com/mediapackage/latest/ug/setting-up-create-trust-rel-policy-cdn.html'
        }
      ]
    );

    mediaPackagePolicy.attachToRole(mediaPackageRole);
    /** get the cfn resource for the role and attach cfn_nag rule */
    (mediaPackageRole.node.defaultChild as cdk.CfnResource).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: 'F38',
            reason: 'Resource level permission is not supported by getRole'
          }, {
            id: 'W11',
            reason: '* is required for MediaPackage CDN Authorization: https://docs.aws.amazon.com/mediapackage/latest/ug/setting-up-create-trust-rel-policy-cdn.html'
          }
        ]
      }
    };


    /**
     * Custom Resource: MediaLive Input
     */
    const mediaLiveInput = new cdk.CustomResource(this, 'MediaLiveInput', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'MediaLiveInput',
        StreamName: `${cdk.Aws.STACK_NAME}-livestream`,
        Type: inputType,
        Cidr: inputCIDR,
        PriUrl: priPullUrl,
        PriUser: priPullUser,
        PriPass: priPullPass,
        SecUrl: secPullUrl,
        SecUser: secPullUser,
        SecPass: secPullPass,
        RoleArn: mediaLiveRole.roleArn,
        PriMediaConnectArn: priMediaConnectArn,
        SecMediaConnectArn: secMediaConnectArn
      }
    });

    /**
     * Custom Resource: MediaLive Channel
     */
    const mediaLiveChannel = new cdk.CustomResource(this, 'MediaLiveChannel', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'MediaLiveChannel',
        Name: `${cdk.Aws.STACK_NAME}-livestream`,
        EncodingProfile: encodingProfile,
        Codec: 'AVC',
        Role: mediaLiveRole.roleArn,
        InputId: mediaLiveInput.getAttString('Id'),
        Type: inputType,
        MediaPackageChannelId: `${cdk.Aws.STACK_NAME}-livestream`
      }
    });

    /**
     * Custom Resource: MediaLive Channel Start
     */
    const mediaLiveChannelStart = new cdk.CustomResource(this, 'MediaLiveChannelStart', { // NOSONAR
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'MediaLiveChannelStart',
        ChannelId: mediaLiveChannel.getAttString('ChannelId'),
        ChannelStart: channelStart
      }
    });

    /**
     * Custom Resource: MediaPackage Channel
     */
    const mediaPackageChannel = new cdk.CustomResource(this, 'MediaPackageChannel', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'MediaPackageChannel',
        ChannelId: `${cdk.Aws.STACK_NAME}-livestream`
      }
    });

    /**
     * Custom Resource: MediaPackage HLS Endpoint
     */
    const mediaPackageHlsEndpoint = new cdk.CustomResource(this, 'MediaPackageHlsEndpoint', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'MediaPackageEndPoint',
        EndPoint: 'HLS',
        ChannelId: mediaPackageChannel.getAttString('ChannelId'),
        SecretsRoleArn: mediaPackageRole.roleArn,
        CdnIdentifierSecret: cdnSecret.secretArn
      }
    });
    mediaPackageHlsEndpoint.node.addDependency(mediaPackagePolicy);

    /**
     * Custom Resource: MediaPackage DASH Endpoint
     */
    const mediaPackageDashEndpoint = new cdk.CustomResource(this, 'MediaPackageDashEndpoint', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'MediaPackageEndPoint',
        EndPoint: 'DASH',
        ChannelId: mediaPackageChannel.getAttString('ChannelId'),
        SecretsRoleArn: mediaPackageRole.roleArn,
        CdnIdentifierSecret: cdnSecret.secretArn
      }
    });
    mediaPackageDashEndpoint.node.addDependency(mediaPackagePolicy);

    /**
     * Custom Resource: MediaPackage CMAF Endpoint
     */
    const mediaPackageCmafEndpoint = new cdk.CustomResource(this, 'MediaPackageCmafEndpoint', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'MediaPackageEndPoint',
        EndPoint: 'CMAF',
        ChannelId: mediaPackageChannel.getAttString('ChannelId'),
        SecretsRoleArn: mediaPackageRole.roleArn,
        CdnIdentifierSecret: cdnSecret.secretArn
      }
    });
    mediaPackageCmafEndpoint.node.addDependency(mediaPackagePolicy);


    /**
     * S3: Logs bucket for CloudFront
     */
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      }
    });
    /** get the cfn resource and attach cfn_nag rule */
    (logsBucket.node.defaultChild as cdk.CfnResource).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: 'W35',
            reason: 'Used to store access logs for other buckets'
          }, {
            id: 'W51',
            reason: 'Bucket is private and does not need a bucket policy'
          }
        ]
      }
    };
    //cdk_nag
    NagSuppressions.addResourceSuppressions(
      logsBucket,
      [
        {
          id: 'AwsSolutions-S1', //same as cfn_nag rule W35
          reason: 'Used to store access logs for other buckets'
        }, {
          id: 'AwsSolutions-S10',
          reason: 'Bucket is private and is not using HTTP'
        }
      ]
    );

    /**
     * CloudFront Distribution
     */
    const cachePolicy = new cloudfront.CachePolicy(this, 'CachePolicy', {
      cookieBehavior: cloudfront.CacheCookieBehavior.all(),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
        'Access-Control-Allow-Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Header',
        'Origin'
      ),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all()
    });

    /** custom error responses */
    const errorResponse400: cloudfront.ErrorResponse = {
      httpStatus: 400,
      ttl: cdk.Duration.seconds(1)
    };
    const errorResponse403: cloudfront.ErrorResponse = {
      httpStatus: 403,
      ttl: cdk.Duration.seconds(1)
    };
    const errorResponse404: cloudfront.ErrorResponse = {
      httpStatus: 404,
      ttl: cdk.Duration.seconds(1)
    };
    const errorResponse405: cloudfront.ErrorResponse = {
      httpStatus: 405,
      ttl: cdk.Duration.seconds(1)
    };
    const errorResponse414: cloudfront.ErrorResponse = {
      httpStatus: 414,
      ttl: cdk.Duration.seconds(1)
    };
    const errorResponse416: cloudfront.ErrorResponse = {
      httpStatus: 416,
      ttl: cdk.Duration.seconds(1)
    };
    const errorResponse500: cloudfront.ErrorResponse = {
      httpStatus: 500,
      ttl: cdk.Duration.seconds(1)
    };
    const errorResponse501: cloudfront.ErrorResponse = {
      httpStatus: 501,
      ttl: cdk.Duration.seconds(1)
    };
    const errorResponse502: cloudfront.ErrorResponse = {
      httpStatus: 502,
      ttl: cdk.Duration.seconds(1)
    };
    const errorResponse503: cloudfront.ErrorResponse = {
      httpStatus: 503,
      ttl: cdk.Duration.seconds(1)
    };
    const errorResponse504: cloudfront.ErrorResponse = {
      httpStatus: 504,
      ttl: cdk.Duration.seconds(1)
    };

    const distribution = new cloudfront.Distribution(this, 'CloudFront', {
      defaultBehavior: {
        origin: new origin.HttpOrigin(mediaPackageHlsEndpoint.getAttString('DomainName'), {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          customHeaders: {
            'X-MediaPackage-CDNIdentifier': uuid.getAttString('UUID')
          }
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cachePolicy,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS
      },
      enabled: true,
      logBucket: logsBucket,
      logFilePrefix: 'cloudfront-logs/',
      errorResponses: [
        errorResponse400,
        errorResponse403,
        errorResponse404,
        errorResponse405,
        errorResponse414,
        errorResponse416,
        errorResponse500,
        errorResponse501,
        errorResponse502,
        errorResponse503,
        errorResponse504
      ]
    });
    /** get the cfn resource and attach cfn_nag rule */
    (distribution.node.defaultChild as cdk.CfnResource).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: 'W70',
            reason: 'CloudFront automatically sets the security policy to TLSv1 when the distribution uses the CloudFront domain name (CloudFrontDefaultCertificate=true)'
          }
        ]
      }
    };
    //cdk_nag
    NagSuppressions.addResourceSuppressions(
      distribution,
      [
        {
          id: 'AwsSolutions-CFR1',
          reason: 'Use case does not warrant CloudFront Geo restriction'
        }, {
          id: 'AwsSolutions-CFR2',
          reason: 'Use case does not warrant CloudFront integration with AWS WAF'
        }, {
          id: 'AwsSolutions-CFR4', //same as cfn_nag rule W70
          reason: 'CloudFront automatically sets the security policy to TLSv1 when the distribution uses the CloudFront domain name'
        }, {
          id: 'AwsSolutions-CFR5', //same as cfn_nag rule W70
          reason: 'CloudFront automatically sets the security policy to TLSv1 when the distribution uses the CloudFront domain name'
        }
      ]
    );

    cdk.Tags.of(distribution).add(
      'mediapackage:cloudfront_assoc',
      mediaPackageChannel.getAttString('Arn')
    );



    /**
     * Demo CloudFront distribution
     */
    const demoErrorResponse404: cloudfront.ErrorResponse = {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html'
    };
    const demoErrorResponse403: cloudfront.ErrorResponse = {
      httpStatus: 403,
      responseHttpStatus: 200,
      responsePagePath: '/index.html'
    };

    const demoDistribution = new CloudFrontToS3(this, 'CloudFrontToS3', {
      cloudFrontDistributionProps: {
        defaultBehavior: {
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cachePolicy,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
        },
        errorResponses: [
          demoErrorResponse404,
          demoErrorResponse403
        ]
      },
      bucketProps: {
        versioned: false
      },
      loggingBucketProps: {
        versioned: false
      },
      cloudFrontLoggingBucketProps: {
        versioned: false
      },
      insertHttpSecurityHeaders: false
    });
    //cdk_nag
    NagSuppressions.addResourceSuppressions(
      demoDistribution.cloudFrontWebDistribution,
      [
        {
          id: 'AwsSolutions-CFR1',
          reason: 'Use case does not warrant CloudFront Geo restriction'
        }, {
          id: 'AwsSolutions-CFR2',
          reason: 'Use case does not warrant CloudFront integration with AWS WAF'
        }, {
          id: 'AwsSolutions-CFR4',
          reason: 'CloudFront automatically sets the security policy to TLSv1 when the distribution uses the CloudFront domain name'
        }
      ],
    );
    NagSuppressions.addResourceSuppressions(
      demoDistribution.s3LoggingBucket!,
      [
        {
          id: 'AwsSolutions-S1',
          reason: 'Used to store access logs for other buckets'
        }
      ]
    );
    NagSuppressions.addResourceSuppressions(
      demoDistribution.cloudFrontLoggingBucket!,
      [
        {
          id: 'AwsSolutions-S1',
          reason: 'Used to store access logs for other buckets'
        }
      ]
    );


    /**
     * Demo IAM policy
     */
    const demoPolicy = new iam.Policy(this, 'DemoIAMPolicy', {
      roles: [customResourceLambda.role!],
      statements: [
        new iam.PolicyStatement({
          resources: [
            demoDistribution.s3Bucket!.bucketArn,
            `arn:${cdk.Aws.PARTITION}:s3:::${demoDistribution.s3Bucket?.bucketName}/*`
          ],
          actions: [
            's3:putObject',
            's3:getObject',
            's3:deleteObject',
            's3:listBucket'
          ]
        }),
        new iam.PolicyStatement({
          resources: [
            `arn:${cdk.Aws.PARTITION}:s3:::%%BUCKET_NAME%%-${cdk.Aws.REGION}`,
            `arn:${cdk.Aws.PARTITION}:s3:::%%BUCKET_NAME%%-${cdk.Aws.REGION}/*`
          ],
          actions: ['s3:getObject']
        })
      ]
    });
    //cdk_nag
    NagSuppressions.addResourceSuppressions(
      demoPolicy,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Lambda role needs access to all contents within the buckets to load files for hosting the web player'
        }
      ]
    );


    /**
     * Custom Resource: Demo deploy
     */
    const demoConsole = new cdk.CustomResource(this, 'DemoConsole', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'DemoConsole',
        srcBucket: `%%BUCKET_NAME%%-${cdk.Aws.REGION}`,
        srcPath: '%%SOLUTION_NAME%%/%%VERSION%%',
        manifestFile: 'console-manifest.json',
        destBucket: demoDistribution.s3Bucket?.bucketName,
        awsExports: `//Configuration file generated by cloudformation
        const awsExports = {
          mediaLiveConsole: 'https://console.aws.amazon.com/medialive/home?region=${cdk.Aws.REGION}#/channels/${mediaLiveChannel.getAttString('ChannelId')}',
          hls_manifest: 'https://${distribution.domainName}/out/v1${mediaPackageHlsEndpoint.getAttString('Manifest')}',
          dash_manifest: 'https://${distribution.domainName}/out/v1${mediaPackageDashEndpoint.getAttString('Manifest')}',
          cmaf_manifest: 'https://${distribution.domainName}/out/v1${mediaPackageCmafEndpoint.getAttString('Manifest')}'
        }`
      }
    });
    demoConsole.node.addDependency(demoPolicy);
    demoConsole.node.addDependency(demoDistribution);


    /**
     * AppRegistry
     */
    const appRegistry = new appreg.Application(this, 'AppRegistryApp', {
      applicationName: 'LiveStreamingOnAws',
      description: '(SO0013) Live Streaming on AWS Solution %%VERSION%%'
    });
    appRegistry.associateStack(this);


    /**
     * AnonymousMetric
     */
    new cdk.CustomResource(this, 'AnonymousMetric', { // NOSONAR
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'AnonymousMetric',
        SolutionId: 'SO0013',
        UUID: uuid.getAttString('UUID'),
        Version: '%%VERSION%%',
        InputType: inputType.valueAsString,
        EncodingProfile: encodingProfile.valueAsString,
        Cidr: inputCIDR.valueAsString,
        ChannelStart: channelStart.valueAsString,
        SendAnonymousMetric: cdk.Fn.findInMap('AnonymousData', 'SendAnonymousData', 'Data')
      }
    });



    /**
     * Outputs
     */
    if (cdk.Fn.findInMap('AnonymousData', 'SendAnonymousData', 'Data')) {
      new cdk.CfnOutput(this, 'AnonymousMetricUUID', { // NOSONAR
        description: 'AnonymousMetric UUID',
        value: uuid.getAttString('UUID'),
        exportName: `${cdk.Aws.STACK_NAME}-AnonymousMetricUUID`
      });
    }

    new cdk.CfnOutput(this, 'MediaLiveChannelConsole', { // NOSONAR
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/medialive/home?region=${cdk.Aws.REGION}#!/channels/${mediaLiveChannel.getAttString('ChannelId')}`,
      description: 'MediaLive Channel',
      exportName: `${cdk.Aws.STACK_NAME}-MediaLiveChannel`
    });

    new cdk.CfnOutput(this, 'MediaLiveMetrics', { // NOSONAR
      description: 'MediaLive Metrics',
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/medialive/home?region=${cdk.Aws.REGION}#!/channels/${mediaLiveChannel.getAttString('ChannelId')}/health`,
      exportName: `${cdk.Aws.STACK_NAME}-MediaLiveMetrics`
    });

    new cdk.CfnOutput(this, 'MediaLivePrimaryEndpoint', { // NOSONAR
      value: mediaLiveInput.getAttString('EndPoint1'),
      description: 'Primary MediaLive input URL',
      exportName: `${cdk.Aws.STACK_NAME}-MediaLivePrimaryEndpoint`
    });

    new cdk.CfnOutput(this, 'MediaLiveSecondaryEndpoint', { // NOSONAR
      value: mediaLiveInput.getAttString('EndPoint2'),
      description: 'Secondary MediaLive input URL',
      exportName: `${cdk.Aws.STACK_NAME}-MediaLiveSecondaryEndpoint`
    });

    new cdk.CfnOutput(this, 'MediaPackageMetrics', { // NOSONAR
      description: 'MediaPackage Metrics',
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/mediapackage/home?region=${cdk.Aws.REGION}#/channels/${mediaPackageChannel.getAttString('ChannelId')}?tabId=metrics`,
      exportName: `${cdk.Aws.STACK_NAME}-MediaPackageMetrics`
    });

    new cdk.CfnOutput(this, 'CloudFrontHlsEndpoint', { // NOSONAR
      description: 'HLS CloudFront URL',
      value: `https://${distribution.domainName}/out/v1${mediaPackageHlsEndpoint.getAttString('Manifest')}`,
      exportName: `${cdk.Aws.STACK_NAME}-CloudFrontHlsEndpoint`
    });

    new cdk.CfnOutput(this, 'CloudFrontDashEndpoint', { // NOSONAR
      description: 'DASH CloudFront URL',
      value: `https://${distribution.domainName}/out/v1${mediaPackageDashEndpoint.getAttString('Manifest')}`,
      exportName: `${cdk.Aws.STACK_NAME}-CloudFrontDashEndpoint`
    });

    new cdk.CfnOutput(this, 'CloudFrontCmafEndpoint', { // NOSONAR
      description: 'CMAF CloudFront URL',
      value: `https://${distribution.domainName}/out/v1${mediaPackageCmafEndpoint.getAttString('Manifest')}`,
      exportName: `${cdk.Aws.STACK_NAME}-CloudFrontCmafEndpoint`
    });

    new cdk.CfnOutput(this, 'DemoPlayer', { // NOSONAR
      description: 'Demo Player URL',
      value: `https://${demoDistribution.cloudFrontWebDistribution.domainName}/index.html`,
      exportName: `${cdk.Aws.STACK_NAME}-DemoPlayer`
    });

    new cdk.CfnOutput(this, 'DemoBucketConsole', { // NOSONAR
      description: 'Demo bucket',
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/s3/buckets/${demoDistribution.s3Bucket?.bucketName}?region=${cdk.Aws.REGION}`,
      exportName: `${cdk.Aws.STACK_NAME}-DemoBucket`
    });

    new cdk.CfnOutput(this, 'LogsBucketConsole', { // NOSONAR
      description: 'Logs bucket',
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/s3/buckets/${logsBucket.bucketName}?region=${cdk.Aws.REGION}`,
      exportName: `${cdk.Aws.STACK_NAME}-LogsBucket`
    });

    new cdk.CfnOutput(this, 'AppRegistryConsole', { // NOSONAR
      description: 'AppRegistry',
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/servicecatalog/home?#applications/${appRegistry.applicationId}`,
      exportName: `${cdk.Aws.STACK_NAME}-AppRegistry`
    });


    /**
     * Tag all resources with Solution Id
     */
    cdk.Tags.of(this).add(
      'SolutionId',
      'SO0013'
    );

  }
}