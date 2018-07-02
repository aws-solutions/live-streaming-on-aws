/*********************************************************************************************************************
 *  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
/**
 * @author Solution Builders
 Cloudformation custom resource to create and configure resources for MediaLive, MediaPackage and a demo console.
 **/
 const uuid = require('uuid');
 const cfn = require('./lib/cfn');
 const MediaPackage = require('./lib/mediapackage');
 const MediaLive = require('./lib/medialive');
 const Demo = require('./lib/demo');

// Feature/p333333 updated index.js to use async/await
 exports.handler = async (event, context) => {

 	console.log('REQUEST:: ', JSON.stringify(event, null, 2));
	let  config = event.ResourceProperties;
	let responseData;
 	let Id;

	// Each resource returns a promise with a json object to return cloudformation.
 	try {
 		if (event.RequestType === 'Create') {
 			switch (config.Resource) {

 				case 'MediaLiveInput':
 					if (config.Type.includes('PUSH')) {
 						responseData = await MediaLive.createPushInput(config);
 					} else {
 						responseData = await MediaLive.createPullInput(config);
 					}
 					Id = responseData.Id;
 					break;

 				case 'MediaLiveChannel':
 					responseData = await MediaLive.createChannel(config);
 					Id = responseData.ChannelId;
 					break;

 				case 'MediaPackageChannel':
 					responseData = await MediaPackage.createChannel(config);
 					Id = responseData.ChannelId;
 					break;

 				case 'MediaPackageEndPoint':
 					responseData = await MediaPackage.createEndPoint(config);
 					Id = responseData.Id;
 					break;

 				case ('DemoConsole'):
 					await Demo.s3Deploy(config)

 				case ('UUID'):
 					responseData = {UUID: uuid.v4()};
 					break;

 				case ('AnonymousMetric'):
 					await Metrics.send(event);

 				default:
 					console.log(config.Resource, ': not defined as a custom resource, sending success response');
 			}
 		}
 		if (event.RequestType === 'Delete') {
 			switch (config.Resource) {

 				case 'MediaLiveChannel':
 					await MediaLive.deleteChannel(event.PhysicalResourceId);
 					break;

 				case 'MediaPackageChannel':
 					await MediaPackage.deleteChannel(event.PhysicalResourceId);
 					break;

 				case ('DemoConsole'):
 					await Demo.s3Delete(config);
 					break;

 				case ('AnonymousMetric'):
 					await Metrics.send(event);
 					break;

 				default:
					// medialive inputs and mediapackage endpoints are deleted as part of
					// the the channel deletes so not included here, sending default success response
 					console.log(event.LogicalResourceId, ': delte not required, sending success response');
 			}
 		}

 		let response = await cfn.send(event, context,'SUCCESS',responseData, Id);
 		console.log('RESPONSE:: ',responseData);
 		console.log('CFN STATUS:: ',response);
 	}
 	catch (err) {
 		console.log('ERROR:: ',err, err.stack);
 		cfn.send(event, context,'FAILED');
 	}
 };
