/*******************************************************************************
*  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
*
*  Licensed under the Apache License Version 2.0 (the "License"). You may not 
*  use this file except in compliance with the License. A copy of the License is 
*  located at                                                           
*
*      http://www.apache.org/licenses/
*
*  or in the "license" file accompanying this file. This file is distributed on  
*  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or 
*  implied. See the License for the specific language governing permissions and  
*  limitations under the License.      
********************************************************************************/

 const AWS = require('aws-sdk');

 //Create input given an input type
 //FEATURE/P20903447 Mediaconnect added as an input
 let CreateInput = async (config) => {
     const medialive = new AWS.MediaLive({
         region: process.env.AWS_REGION
     });
     const ssm = new AWS.SSM({
         region: process.env.AWS_REGION
     });

     let responseData,
         params,
         data;

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
                 data = await medialive.createInputSecurityGroup(params).promise();
                 params = {
                     InputSecurityGroups: [data.SecurityGroup.Id],
                     Name: config.StreamName,
                     Type: config.Type
                 };
                 //Create input
                 data = await medialive.createInput(params).promise();
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
                 data = await medialive.createInputSecurityGroup(params).promise();
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
                     ]
                 };
                 //Create input
                 data = await medialive.createInput(params).promise();
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
                     ]
                 };
                 //If authentication is required, update params & store U/P in Parameter Store
                 if (config.PriUser !== null && config.PriUser !== '') {
                     params.Sources[0].Username = config.PriUser;
                     params.Sources[0].PasswordParam = config.PriUser;
                     let ssm_params = {
                         Name: config.PriUser,
                         Description: 'Live Stream solution input credentials',
                         Type: 'String',
                         Value: config.PriPass,
                         Overwrite: true
                     };
                     await ssm.putParameter(ssm_params).promise();
                 }
                 if (config.SecUser !== null && config.SecUser !== '') {
                     params.Sources[1].Username = config.SecUser;
                     params.Sources[1].PasswordParam = config.SecUser;
                     let ssm_params = {
                         Name: config.SecUser,
                         Description: 'Live Stream solution input credentials',
                         Type: 'String',
                         Value: config.SecPass,
                         Overwrite: true
                     };
                     await ssm.putParameter(ssm_params).promise();
                 }
                 //Create input
                 data = await medialive.createInput(params).promise();
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
                     ]
                 };
                 //Create input
                 data = await medialive.createInput(params).promise();
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
         throw err;
     }
     return responseData;
 };

 // FEATURE/P15424610:: Function updated to use Async
 let CreateChannel = async (config) => {
     const medialive = new AWS.MediaLive({
         region: process.env.AWS_REGION
     });
     const encode1080p = require('./encoding-profiles/medialive-1080p');
     const encode720p = require('./encoding-profiles/medialive-720p');
     const encode540p = require('./encoding-profiles/medialive-540p');
     let responseData;
     try {
         // Define baseline Paameters for cheate channel
         let params = {
             Destinations: [{
                 Id: "destination1",
                 Settings: [{
                         PasswordParam: config.MediaPackagePriUser,
                         Url: config.MediaPackagePriUrl,
                         Username: config.MediaPackagePriUser
                     },
                     {
                         PasswordParam: config.MediaPackageSecUser,
                         Url: config.MediaPackageSecUrl,
                         Username: config.MediaPackageSecUser
                     }
                 ]
             }],
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
               Solution:'SO0013'
             }
         };

         //hotfix/V52152945 loop only supported in HLS_PULL
         if (config.Type === 'URL_PULL') {
             params.InputAttachments[0].InputSettings = {
                 SourceEndBehavior: 'LOOP'
             };
         }
         // Update parameters based on source resolution (defined in cloudformation)
         switch (config.Resolution) {
             case '1080':
                 params.InputSpecification.Resolution = 'HD';
                 params.InputSpecification.MaximumBitrate = 'MAX_20_MBPS';
                 params.EncoderSettings = encode1080p;
                 break;
             case '720':
                 params.InputSpecification.Resolution = 'HD';
                 params.InputSpecification.MaximumBitrate = 'MAX_10_MBPS';
                 params.EncoderSettings = encode720p;
                 break;
             default:
                 params.InputSpecification.Resolution = 'SD';
                 params.InputSpecification.MaximumBitrate = 'MAX_10_MBPS';
                 params.EncoderSettings = encode540p;
         }

         //Create Channel & return Channel ID
         let data = await medialive.createChannel(params).promise();
         let channelId = data.Channel.Id;
         //feature/V103650687 check channel create completes.
         let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
         params = {
             ChannelId: channelId
         };
         data = await medialive.describeChannel(params).promise();
         let state = data.State;
         //Wait for Channel create to complete, valid States are CREATING, IDLE, CREATE_FAILED
         while (state === 'CREATING') {
             await sleep(3000);
             data = await medialive.describeChannel(params).promise();
             state = data.State;
             if (state === 'CREATE_FAILED') {
                 return Promise.reject('CREATE_FAILED');
             }
         }
         responseData = {
             ChannelId: channelId
         };
     } catch (err) {
         throw err;
     }
     return responseData;
 };

 let StartChannel = async (config) => {
     const medialive = new AWS.MediaLive({
         region: process.env.AWS_REGION
     });
     try {
         let params = {
             ChannelId: config.ChannelId
         };
         await medialive.startChannel(params).promise();
     } catch (err) {
         throw err;
     }
     return 'success';
 };


 // FEATURE/P15424610:: Function updated to use Async & support to stop the
 // channel before atempting to delete it (required to avoid a stack failure)
 let DeleteChannel = async (ChannelId) => {
     const medialive = new AWS.MediaLive({
         region: process.env.AWS_REGION
     });
     //Sleep function to set a time delay between stopping & deleting the channel
     const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
     try {
         let params = {
             ChannelId: ChannelId
         };
         //stop channel
         await medialive.stopChannel(params).promise();
         // get the status of the channel
         let data = await medialive.describeChannel(params).promise();
         let state = data.State;
         while (state !== 'IDLE') //keep checking channel status every 30 seconds till it is stopped
         {
             await sleep(30000);
             data = await medialive.describeChannel(params).promise();
             state = data.State;
         }
         // delete channel
         data = await medialive.deleteChannel(params).promise();
         //feature/P20903447 Delete SecurityGroup if it was configured.
         let sg;
         params = {
             InputId: data.InputAttachments[0].InputId
         };
         //Get input information
         data = await medialive.describeInput(params).promise();
         if (data.SecurityGroups) {
             sg = data.SecurityGroups[0];
         }
         state = data.State;
         while (state !== "DETACHED") { //keep checking input status every 30 seconds till it is detached from the channel
             //wait 10 seconds
             await sleep(10000);
             data = await medialive.describeInput(params).promise();
             state = data.State;
         }
         //delete input and then SG
         await medialive.deleteInput(params).promise();
         // wait 1 seconds
         await sleep(1000);
         //delete SG if sg is not null
         if (sg) {
             params = {
                 InputSecurityGroupId: sg
             };
             await medialive.deleteInputSecurityGroup(params).promise();
         }
     } catch (err) {
         throw err;
     }
     return;
 };

 //FEATURE/P20903447 Mediaconnect added as an input
 module.exports = {
     createInput: CreateInput,
     createChannel: CreateChannel,
     startChannel: StartChannel,
     deleteChannel: DeleteChannel
 };
