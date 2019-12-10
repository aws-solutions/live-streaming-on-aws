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

 const uuid = require('uuid');
 const cfn = require('./lib/cfn');
 const MediaPackage = require('./lib/mediapackage');
 const MediaLive = require('./lib/medialive');
 const Demo = require('./lib/demo');
 const Metrics = require('./lib/metrics');

//updated index.js to use async/await
 exports.handler = async (event, context) => {

	let  config = event.ResourceProperties;
	let responseData = {};
 	let Id;

	// Each resource returns a promise with a json object to return cloudformation.
 	try {
    console.log('RESOURCE:: ',config.Resource);
 		if (event.RequestType === 'Create') {
 			switch (config.Resource) {

 				case 'MediaLiveInput':
          //FEATURE/P20903447 Mediaconnect added as an input
 					responseData = await MediaLive.createInput(config);
 					Id = responseData.Id;
 					break;

 				case 'MediaLiveChannel':
 					responseData = await MediaLive.createChannel(config);
 					Id = responseData.ChannelId;
 					break;

        case 'MediaLiveChannelStart':
          await MediaLive.startChannel(config);
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
 					await Demo.s3Deploy(config);
          break;

 				case ('UUID'):
 					responseData = {UUID: uuid.v4()};
 					break;

 				case ('AnonymousMetric'):
 					Metrics.send(config);
          break;

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

        // FEATURE/P15424610:: Removed Metrics as create/delete captured by CFN metrics
 				default:
					// medialive inputs and mediapackage endpoints are deleted as part of
					// the the channel deletes so not included here, sending default success response
 					console.log(event.LogicalResourceId, ': delete not required, sending success response');
 			}
 		}

 		let response = await cfn.send(event, context,'SUCCESS',responseData, Id);
 		console.log('CFN STATUS:: ',response);
 	}
 	catch (err) {
 		console.log('ERROR:: ',err, err.stack);
 		await cfn.send(event, context,'FAILED');
 	}
 };
