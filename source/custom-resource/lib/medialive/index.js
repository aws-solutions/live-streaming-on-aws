// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { 
    MediaLiveClient,
    CreateChannelCommand,
    StartChannelCommand,
    StopChannelCommand,
    DeleteChannelCommand,
    DescribeInputCommand,
    DeleteInputCommand,
    DescribeInputSecurityGroupCommand,
    DeleteInputSecurityGroupCommand,
    CreateInputSecurityGroupCommand,
    CreateInputCommand
} = require('@aws-sdk/client-medialive');
const { SSM } = require('@aws-sdk/client-ssm');

const createInput = async (config) => {

   const medialive = new MediaLiveClient({
        region: process.env.AWS_REGION,
        customUserAgent: process.env.SOLUTION_IDENTIFIER
    });
    const ssm = new SSM({
        region: process.env.AWS_REGION,
        customUserAgent: process.env.SOLUTION_IDENTIFIER
    });
    let params,data,responseData;
    try {
        switch (config.Type) {
            //Create input for RTP_PUSH input type
            case 'RTP_PUSH':
                //Requires security group
                params = {
                    WhitelistRules: [{
                        Cidr: config.Cidr
                    }]
                };
                data = await medialive.send(new CreateInputSecurityGroupCommand(params));
                params = {
                    InputSecurityGroups: [data.SecurityGroup.Id],
                    Name: config.StreamName,
                    Type: config.Type,
                    Tags: {'SolutionId': 'SO0109'}
                };
                //Create input
                data = await medialive.send(new CreateInputCommand(params));
                responseData = {
                    Id: data.Input.Id,
                    EndPoint1: data.Input.Destinations[0].Url,
                    EndPoint2: data.Input.Destinations[1].Url
                };
                break;

                //Create input for RTMP_PUSH input type
            case 'RTMP_PUSH':
                //Requires SG and 2 destinations
                params = {
                    WhitelistRules: [{
                        Cidr: config.Cidr
                    }]
                };
                data = await medialive.send(new CreateInputSecurityGroupCommand(params));
                params = {
                    InputSecurityGroups: [data.SecurityGroup.Id],
                    Name: config.StreamName,
                    Type: config.Type,
                    Destinations: [{
                            StreamName: config.StreamName + '/primary'
                        },
                        {
                            StreamName: config.StreamName + '/secondary'
                        }
                    ],
                    Tags: {'SolutionId': 'SO0109'}
                };
                //Create input
                data = await medialive.send(new CreateInputCommand(params));
                responseData = {
                    Id: data.Input.Id,
                    EndPoint1: data.Input.Destinations[0].Url,
                    EndPoint2: data.Input.Destinations[1].Url
                };
                break;

                //Create input for RTMP_PULL or URL_PULL input type
            case 'RTMP_PULL':
            case 'URL_PULL':
                //Requires 2 source URLs, authentication is optional.
                params = {
                    Name: config.StreamName,
                    Type: config.Type,
                    Sources: [{
                            Url: config.PriUrl
                        },
                        {
                            Url: config.SecUrl
                        }
                    ],
                    Tags: {'SolutionId': 'SO0109'}
                };
                //If authentication is required, update params & store U/P in Parameter Store
                if (config.PriUser !== null && config.PriUser !== '') {
                    params.Sources[0].Username = config.PriUser;
                    params.Sources[0].PasswordParam = config.PriUser;
                    const ssm_params = {
                        Name: config.PriUser,
                        Description: 'Live Stream solution input credentials',
                        Type: 'String',
                        Value: config.PriPass,
                        Overwrite: true
                    };
                    await ssm.putParameter(ssm_params);
                }
                if (config.SecUser !== null && config.SecUser !== '') {
                    params.Sources[1].Username = config.SecUser;
                    params.Sources[1].PasswordParam = config.SecUser;
                    const ssm_params = {
                        Name: config.SecUser,
                        Description: 'Live Stream solution input credentials',
                        Type: 'String',
                        Value: config.SecPass,
                        Overwrite: true
                    };
                    await ssm.putParameter(ssm_params);
                }
                //Create input
                data = await medialive.send(new CreateInputCommand(params));
                responseData = {
                    Id: data.Input.Id,
                    EndPoint1: 'Push InputType only',
                    EndPoint2: 'Push InputType only'
                };
                break;

                //Create input for MEDIACONNECT input type
            case 'MEDIACONNECT':
                //Requires 2 Mediaconnect Arns
                params = {
                    Name: config.StreamName,
                    Type: config.Type,
                    RoleArn: config.RoleArn,
                    MediaConnectFlows: [{
                            FlowArn: config.PriMediaConnectArn
                        },
                        {
                            FlowArn: config.SecMediaConnectArn
                        }
                    ],
                    Tags: {'SolutionId': 'SO0109'}
                };
                //Create input
                data = await medialive.send(new CreateInputCommand(params));
                responseData = {
                    Id: data.Input.Id,
                    EndPoint1: 'Push InputType only',
                    EndPoint2: 'Push InputType only'
                };
                break;

            default:
                return Promise.reject("input type not defined in request");

        } //End switch (config.Type)

    } catch (err) {
        console.error(err);
        throw err;
    }

    return responseData;
};


const createChannel = async (config) => {
    const medialive = new MediaLiveClient({
        region: process.env.AWS_REGION,
        customUserAgent: process.env.SOLUTION_IDENTIFIER
    });
    const encode1080p = require('./encoding-profiles/hd-1080p');
    const encode720p = require('./encoding-profiles/hd-720p');
    const encode540p = require('./encoding-profiles/sd-540p');
    let params,data,responseData;
    try {
        // Define baseline Paameters for cheate channel
        params = {
            Destinations: [
                {
                    Id: "destination1",
                    MediaPackageSettings: [
                        {
                            ChannelId: config.MediaPackageChannelId
                        }
                    ]
                }
            ],
            InputSpecification: {
                Codec: config.Codec,
                Resolution: '',
                MaximumBitrate: ''
            },
            Name: config.Name,
            RoleArn: config.Role,
            InputAttachments: [{
                InputId: config.InputId,
                InputSettings: {}
            }],
            EncoderSettings: {},
            Tags: {
              SolutionId:'SO0013'
            }
        };

        if (config.Type === 'URL_PULL') {
            params.InputAttachments[0].InputSettings = {
                SourceEndBehavior: 'LOOP'
            };
        }
        switch (config.EncodingProfile) {
            case 'HD-1080p':
                params.InputSpecification.Resolution = 'HD';
                params.InputSpecification.MaximumBitrate = 'MAX_20_MBPS';
                params.EncoderSettings = encode1080p;
                break;
            case 'HD-720p':
                params.InputSpecification.Resolution = 'HD';
                params.InputSpecification.MaximumBitrate = 'MAX_10_MBPS';
                params.EncoderSettings = encode720p;
                break;
            case 'SD-540p':
                params.InputSpecification.Resolution = 'SD';
                params.InputSpecification.MaximumBitrate = 'MAX_10_MBPS';
                params.EncoderSettings = encode540p;
                break;
            default:
                throw new Error(`EncodingProfile is invalid or undefined: ${config.EncodingProfile}`)
        }
        console.log(`Creating Channel with a ${config.EncodingProfile} profile`);
        data = await medialive.send(new CreateChannelCommand(params));
        responseData = {
            ChannelId: data.Channel.Id
        };
    } catch (err) {
        console.error(err);
        throw err;
    }
    return responseData;
};


const startChannel = async (config) => {
   console.log('Starting Channel.....');
   const medialive = new MediaLiveClient({
       region: process.env.AWS_REGION,
       customUserAgent: process.env.SOLUTION_IDENTIFIER
   });
   try {
       let params = {
           ChannelId: config.ChannelId
       };
       await medialive.send(new StartChannelCommand(params));
   } catch (err) {
       console.error(err);
       throw err;
   }
   return 'success';
};


const deleteInput = async (InputId) => {
   console.log('Deleting Input.....');
   const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
   const medialive = new MediaLiveClient({
       region: process.env.AWS_REGION,
       customUserAgent: process.env.SOLUTION_IDENTIFIER
   });
   let params,
       data;
   try {
       params = {
           InputId: InputId
       };
       data = await medialive.send(new DescribeInputCommand(params));
       let state = data.State;
       let retry = 5;
       while (state !== 'DETACHED') {
            await sleep(6000);
            data = await medialive.send(new DescribeInputCommand(params));
            state = data.State;
            retry = retry - 1;
            if (retry === 0 && state !== 'DETACHED') {
                throw new Error(`Failed to delete Input, state: ${state} is not DETACHED`);
            }
       }
       await medialive.send(new DeleteInputCommand(params));
       if (data.SecurityGroups && data.SecurityGroups.length !== 0 ) {
           params = {
                InputSecurityGroupId: data.SecurityGroups[0]
           };
           /**
           * When the input is deleted the SG is detached however it can take a few seconds for the SG state
           * to change from IN_USE to IDLE
           */
           state = '';
           retry = 5;
           while (state !== 'IDLE') {
               await sleep(6000);
               data = await medialive.send(new DescribeInputSecurityGroupCommand(params));
               state = data.State;
               retry = retry -1;
               if (retry === 0 && state !== 'IDLE') {
                   throw new Error(`Failed to delete Security Group, state: ${state} is not IDLE`);
               }
           }
           await medialive.send(new DeleteInputSecurityGroupCommand(params));
       }
   } catch (err) {
       console.error(err);
       throw err;
   }
   return 'success';
};


const deleteChannel = async (ChannelId) => {
   console.log('Deleting Channel.....');
   const medialive = new MediaLiveClient({
       region: process.env.AWS_REGION,
       customUserAgent: process.env.SOLUTION_IDENTIFIER
   });
   let params;
   try {
       params = {
           ChannelId: ChannelId
       };
       await medialive.send(new StopChannelCommand(params));
       await medialive.send(new DeleteChannelCommand(params));

   } catch (err) {
       console.error(err);
       throw err;
   }
   return 'success';
};


module.exports = {
    createInput: createInput,
    createChannel: createChannel,
    startChannel: startChannel,
    deleteInput: deleteInput,
    deleteChannel: deleteChannel
};
