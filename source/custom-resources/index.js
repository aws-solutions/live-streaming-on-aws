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

exports.handler = function(event, context) {
	console.log('Received event:', JSON.stringify(event, null, 2));

	if (event.RequestType === 'Create') {

		switch (event.LogicalResourceId) {

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

		switch (event.ResourceProperties.Resource) {

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
