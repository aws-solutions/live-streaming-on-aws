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
    // const inputDeviceId = new cdk.CfnParameter(this, 'InputDeviceId', {
    //     type: 'String',
    //     description: 'Specify the ID for your Elemental Link Input device (please note a Link device can only be attached to one input at a time)',
    //     default: ''
    // });
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
                  Parameters: [priPullUrl.logicalId, priPullUser.logicalId, priPullPass.logicalId,secPullUrl.logicalId, secPullUser.logicalId, secPullPass.logicalId]
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



      
    }
  }