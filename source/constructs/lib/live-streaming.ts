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
import * as mediapackage from '@aws-cdk/aws-mediapackage';
import * as s3 from '@aws-cdk/aws-s3';
import { Secret } from '@aws-cdk/aws-secretsmanager';
import { CachePolicy } from '@aws-cdk/aws-cloudfront';


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
      description: 'Specify the input type for MediaLive (default parameters are for the demo video).  For details on setting up each input type, see https://docs.aws.amazon.com/solutions/latest/live-streaming-on-aws-with-amazon-s3/appendix-a.html.',
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
      description: 'For URL and RTMP PULL input types ONLY, specify the primary source URL, this should be a HTTP or HTTPS link to the stream manifest file.',
      default: 'https://d15an60oaeed9r.cloudfront.net/live_stream_v2/sports_reel_with_markers.m3u8'
    });
    const priPullUser = new cdk.CfnParameter(this, 'PriPullUser', {
      type: 'String',
      description: 'For URL and RTMP PULL input types ONLY, if basic authentication is enabled on the primary source stream enter the username',
      default: ''
    });
    const priPullPass = new cdk.CfnParameter(this, 'PriPullPass', {
      type: 'String',
      description: 'For URL and RTMP PULL input types ONLY, if basic authentication is enabled on the primary source stream enter the password',
      default: '',
      noEcho: true
    });
    const secPullUrl = new cdk.CfnParameter(this, 'SecPullUrl', {
      type: 'String',
      description: 'For URL and RTMP PULL input types ONLY, specify the secondary source URL, this should be a HTTP or HTTPS link to the stream manifest file.',
      default: 'https://d15an60oaeed9r.cloudfront.net/live_stream_v2/sports_reel_with_markers.m3u8'
    });
    const secPullUser = new cdk.CfnParameter(this, 'SecPullUser', {
      type: 'String',
      description: 'For URL and RTMP PULL input types ONLY, if basic authentication is enabled on the secondary source stream enter the username',
      default: ''
    });
    const secPullPass = new cdk.CfnParameter(this, 'SecPullPass', {
      type: 'String',
      description: 'For URL and RTMP PULL input types ONLY, if basic authentication is enabled on the secondary source stream enter the password',
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
      description: 'If your source is ready to stream select true, this wil start the MediaLive Channel as part of the deployment. If you select false you will need to manually start the MediaLive Channel when your source is ready.',
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
            Parameters: [priMediaConnectArn.logicalId, secMediaConnectArn]
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
            default: 'Input Security Group CIDR Block (REQUIRED)'
          },
          PriPullUrl: {
            default: 'Primary Source URL (REQUIRED)'
          },
          PriPullUser: {
            default: 'Primary Source Username (OPTIONAL)'
          },
          PriPullPass: {
            default: 'Primary Source Password (REQUIRED)'
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
    new cdk.CfnMapping(this, 'AnonymousData', {
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


    /**
     * IAM: MediaPackage Role
     */
    const mediaPackageRole = new iam.Role(this, 'MediaPackageRole', {
      assumedBy: new iam.ServicePrincipal('mediapackage.amazonaws.com'),
    });


    /**
     * Custom Resource: Lambda
     */
    const customResourceLambda = new lambda.Function(this, 'CustomResource', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      description: 'Used to deploy custom resources and send AnonymousData',
      environment: {
        SOLUTION_IDENTIFIER: 'AwsSolution/SO0013/%%VERSION%%'
      },
      code: lambda.Code.fromAsset('../custom-resource'),
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
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
            'mediapackage:CreateOriginEndpoint'
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

    const mediaPackagePolicy = new iam.Policy(this, 'MediaPackagePolicy', {
      statements: [
        new iam.PolicyStatement({
          resources: [`arn:${cdk.Aws.PARTITION}:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:${cdnSecret.secretName}`],
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
     * CloudFront Distribution & log bucket
     */
    const cachePolicy = new CachePolicy(this, 'CachePolicy', {
      headerBehavior: {
        behavior: 'whitelist',
        headers: ['Origin']
      }
    });




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
    const mediaLiveChannelStart = new cdk.CustomResource(this, 'MediaLiveChannelStart', {
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

    // /**
    //  * Custom Resource: MediaPackage HLS Endpoint
    //  */
    const mediaPackageHlsEndpoint = new cdk.CustomResource(this, 'MediaPackageHlsEndpoint', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'MediaPackageEndPoint',
        EndPoint: 'HLS',
        ChannelId: mediaPackageChannel.getAttString('ChannelId'),
        //SecretsRoleArn: mediaPackageRole.roleArn,
        //CdnIdentifierSecret: `arn:${cdk.Aws.PARTITION}:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:${cdnSecret.secretName}`
      }
    });

    /**
     * Custom Resource: MediaPackage DASH Endpoint
     */
    const mediaPackageDashEndpoint = new cdk.CustomResource(this, 'MediaPackageDashEndpoint', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'MediaPackageEndPoint',
        EndPoint: 'DASH',
        ChannelId: mediaPackageChannel.getAttString('ChannelId'),
        //SecretsRoleArn: mediaPackageRole.roleArn,
        //CdnIdentifierSecret: `arn:${cdk.Aws.PARTITION}:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:${cdnSecret.secretName}`
      }
    });

    /**
     * Custom Resource: MediaPackage CMAF Endpoint
     */
    const mediaPackageCmafEndpoint = new cdk.CustomResource(this, 'MediaPackageCmafEndpoint', {
      serviceToken: customResourceLambda.functionArn,
      properties: {
        Resource: 'MediaPackageEndPoint',
        EndPoint: 'CMAF',
        ChannelId: mediaPackageChannel.getAttString('ChannelId'),
        //SecretsRoleArn: mediaPackageRole.roleArn,
        //CdnIdentifierSecret: `arn:${cdk.Aws.PARTITION}:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:${cdnSecret.secretName}`
      }
    });

    /**
     * Demo bucket
     */



    /**
     * Custom Resource: UUID
     */


    /**
     * AnonymousMetric
     */


    /**
     * Outputs
     */






  }
}