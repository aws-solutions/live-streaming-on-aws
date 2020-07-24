/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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
const uuid = require('uuid');
const cfn = require('./lib/cfn');
const mediaPackage = require('./lib/mediapackage');
const mediaLive = require('./lib/medialive');
const demo = require('./lib/demo');
const metrics = require('./lib/metrics');


exports.handler = async (event, context) => {

    console.log(`event: ${JSON.stringify(event,null,2)}`);

    const resource = event.ResourceProperties.Resource;
    const config = event.ResourceProperties;
    let Id, responseData;

    try {
        if (event.RequestType === 'Create') {

            switch (resource) {

                case ('UUID'):
                    responseData = {
                        UUID: uuid.v4()
                    };
                    break;

                case 'MediaLiveInput':
                    responseData = await mediaLive.createInput(config);
                    Id = responseData.Id;
                    break;

                case 'MediaLiveChannel':
                    responseData = await mediaLive.createChannel(config);
                    Id = responseData.ChannelId;
                    break;

                case 'MediaLiveChannelStart':
                    await mediaLive.startChannel(config);
                    break;

                case 'MediaPackageChannel':
                    responseData = await mediaPackage.createChannel(config);
                    Id = responseData.ChannelId;
                    break;
                case 'MediaPackageEndPoint':
                    responseData = await mediaPackage.createEndPoint(config);
                    Id = responseData.Id;
                    break;

                case ('DemoConsole'):
                    await demo.copyAssets(config);
                    break;

                case ('AnonymousMetric'):
                    await metrics.send(config);
                    break;

                default:
                    throw Error(resource + ' not defined as a resource');
            }
        }
        if (event.RequestType === 'Update') {
            //Update not required for metrics
        }

        if (event.RequestType === 'Delete') {
            switch (resource) {

                case 'MediaLiveInput':
                    await mediaLive.deleteInput(event.PhysicalResourceId);
                    break;

                case 'MediaLiveChannel':
                    await mediaLive.deleteChannel(event.PhysicalResourceId);
                    break;

                case 'MediaPackageChannel':
                    await mediaPackage.deleteChannel(event.PhysicalResourceId);
                    break;

                case ('DemoConsole'):
                    await demo.delAssets(config);
                    break;

                default:
                    console.log(event.LogicalResourceId, ': delete not required, sending success response');
            }
        }
        const response = await cfn.send(event, context,'SUCCESS',responseData, Id);
        console.log(response);
    } catch (err) {
        console.log(err, err.stack);
        cfn.send(event, context, 'FAILED', {}, resource);
    }
};