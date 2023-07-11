// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const uuid = require('uuid');
const cfn = require('./lib/cfn');
const mediaPackage = require('./lib/mediapackage');
const mediaLive = require('./lib/medialive');
const demo = require('./lib/demo');
const metrics = require('./lib/metrics');

exports.handler = async (event, context) => {

    const resource = event.ResourceProperties.Resource;
    const config = event.ResourceProperties;
    let Id, responseData;

    if(resource == "MediaLiveInput"){
        // Do not log input details which may contain sensative passwords
    }else{
        console.log(`event: ${JSON.stringify(event,null,2)}`);
    }

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
                    if (config.ChannelStart === 'Yes') {
                        await mediaLive.startChannel(config);
                    }
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

                case ('AnonymizedMetric'):
                    if (config.SendAnonymizedMetric === 'Yes') {
                        await metrics.send(config);
                    } else {
                        console.log('Anonymized metric not sent.');
                    }
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