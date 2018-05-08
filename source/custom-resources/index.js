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
 Cloudformation custom resource to create and configure resources as part of the cloudformation deployment.
 **/
'use strict';
const cfn = require('cfn-response');
const uuid = require('uuid');
const moment = require('moment');
const MetricsHelper = require('./lib/metrics-helper.js');
const MediaPackageChannel = require('./lib/media-package/channel.js');
const MediaPackageEndpoint = require('./lib/media-package/endpoint.js');
const MedialiveInput = require('./lib/media-live/input.js');

exports.handler = function(event, context) {

	console.log('Received event:', JSON.stringify(event, null, 2));
	const config = event.ResourceProperties;

	if (event.RequestType === 'Create') {

		switch (event.LogicalResourceId) {

			case 'MediaLiveInput':
				if (config.Type.includes('PULL')) {
					MedialiveInput.createPullInput(config)
						.then(responseData => {
							console.log('MediaLive ',config.Type, 'Input created: ',JSON.stringify(responseData,null,2));
							cfn.send(event,context,cfn.SUCCESS,responseData,responseData.Id);
						})
						.catch(err => {
							console.log(err, err.stack);
							cfn.send(event,context,cfn.FAILED);
						});
				} else {
					MedialiveInput.createPushInput(config)
						.then(responseData => {
							console.log('MediaLive ',config.Type, 'Input created: ',JSON.stringify(responseData,null,2));
							cfn.send(event,context,cfn.SUCCESS,responseData,responseData.Id);
						})
						.catch(err => {
							console.log(err, err.stack);
							cfn.send(event,context,cfn.FAILED);
						});
				}
				break;

			case 'MediaPackageChannel':
				MediaPackageChannel.createChannel(config)
					.then(responseData => {
						cfn.send(event,context,cfn.SUCCESS,responseData,config.ChannelId);
						console.log(responseData);
					})
					.catch(err => {
						console.log(err, err.stack);
						cfn.send(event,context,cfn.FAILED);
					});
				break;

			case 'MediaPackageHlsEndpoint':
				MediaPackageEndpoint.createHlsEndPoint(config)
					.then(responseData => {
						cfn.send(event,context,cfn.SUCCESS,responseData,config.ChannelId+'-hls');
						console.log(responseData);
					})
					.catch(err => {
						console.log(err, err.stack);
						cfn.send(event,context,cfn.FAILED);
					});
				break;

			case 'MediaPackageDashEndpoint':
				MediaPackageEndpoint.createDashEndPoint(config)
					.then(responseData => {
						cfn.send(event,context,cfn.SUCCESS,responseData,config.ChannelId+'-dash');
						console.log(responseData);
					})
					.catch(err => {
						console.log(err, err.stack);
						cfn.send(event,context,cfn.FAILED);
					});
				break;

			case 'MediaPackageMssEndpoint':
				MediaPackageEndpoint.createMssEndPoint(config)
					.then(responseData => {
						cfn.send(event,context,cfn.SUCCESS,responseData,config.ChannelId+'-mss');
						console.log(responseData);
					})
					.catch(err => {
						console.log(err, err.stack);
						cfn.send(event,context,cfn.FAILED);
					});
				break;

      case ('Uuid'):
        //Creates a UUID for the MetricsHelper function
        let responseData = {
          UUID: uuid.v4()
        };
        cfn.send(event, context, cfn.SUCCESS, responseData);
        break;

			case ('AnonymousMetric'):
        //Sends annonomous useage data to AWS
        let metricsHelper = new MetricsHelper();
        let metric = {
            Solution: event.ResourceProperties.SolutionId,
            UUID: event.ResourceProperties.UUID,
            TimeStamp: moment().utc().format('YYYY-MM-DD HH:mm:ss.S'),
            Data: {
                Version: event.ResourceProperties.Version,
                Launched: moment().utc().format(),
                InputType: event.ResourceProperties.InputType,
                InputCodec: event.ResourceProperties.InputCodec,
                InputRes: event.ResourceProperties.InputRes
            }
        };
        metricsHelper.sendAnonymousMetric(metric, function(err, data) {
          if (err) {
            //logging error only to allow stack to complete
            console.log(err, err.stack);
          } else {
            console.log('data sent: ', metric);
            cfn.send(event, context, cfn.SUCCESS);
            return;
          }
        });
        break;

			default:
				console.log('no case match, sending success response');
				cfn.send(event, context, cfn.FAILED);
		}
	}

		if (event.RequestType === 'Delete') {

		switch (event.LogicalResourceId) {

			case 'MediaPackageChannel':
				// This function will delete the endpoints and then the channel
				MediaPackageChannel.deleteChannel(config)
					.then(responseData => {
						cfn.send(event, context, cfn.SUCCESS);
						console.log(responseData);
					})
					.catch(err => {
						console.log(err, err.stack);
					});
				break;

			case ('AnonymousMetric'):
        let metricsHelper = new MetricsHelper();
        let metric = {
            Solution: event.ResourceProperties.solutionId,
            UUID: event.ResourceProperties.UUID,
            TimeStamp: moment().utc().format('YYYY-MM-DD HH:mm:ss.S'),
            Data: {
                Version: event.ResourceProperties.version,
                Deleted: moment().utc().format()
            }
        };
        metricsHelper.sendAnonymousMetric(metric, function(err, data) {
          if (err) {
            console.log(err, err.stack);
          } else {
            console.log('data sent');
            cfn.send(event, context, cfn.SUCCESS);
            return;
          }
        });
        break;

			default:
				console.log('no delete required, sending success response');
				cfn.send(event, context, cfn.SUCCESS);
		}
	}
};
