#!/usr/bin/python
# -*- coding: utf-8 -*-
##############################################################################
#  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.   #
#                                                                            #
#  Licensed under the Apache License Version 2.0 (the "License").            #
#  You may not use this file except in compliance with the License.          #
#  A copy of the License is located at                                       #
#                                                                            #
#      http://www.apache.org/licenses/                                       #
#                                                                            #
#  or in the "license" file accompanying this file. This file is distributed #
#  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,        #
#  express or implied. See the License for the specific language governing   #
#  permissions and limitations under the License.                            #
##############################################################################

import json
import urllib
import boto3
import uuid
import logging
import lib.cfnresponse as cfn
import lib.mediapackage as MediaPackage
import lib.medialive as MediaLive
import lib.demo as Demo
import lib.metrics as Metrics

def handler(event, context):

    #Each resource returns a promise with a json object to return cloudformation.
    try:
        request =event['RequestType']
        resource = event['ResourceProperties']['Resource']
        config = event['ResourceProperties']
        responseData = {}
        print('Request::{} Resource:: {}'.format(request,resource))

        if request == 'Create':
            if resource == 'MediaLiveInput':
                responseData = MediaLive.create_input(config)
                id = responseData['Id']

            elif resource == 'MediaLiveChannel':
                responseData = MediaLive.create_channel(config)
                id = responseData['ChannelId']

            elif resource == 'MediaLiveChannelStart':
                MediaLive.start_channel(config)
                id = 'MediaLiveChannelStart'

            elif resource == 'MediaPackageChannel':
                responseData = MediaPackage.create_channel(config)
                id = responseData['ChannelId']

            elif resource == 'MediaPackageEndPoint':
                responseData = MediaPackage.create_endpoint(config)
                id = responseData['Id']

            elif resource == 'DemoConsole':
                Demo.s3_deploy(config)
                id = 'DemoConsole'

            elif resource == 'UUID':
                responseData = {'UUID':str(uuid.uuid4())}
                id = responseData['UUID']

            elif resource == 'AnonymousMetric':
                Metrics.send_metrics(config)
                id = 'Metrics Sent'

            else:
                print('Create failed, {} not defined in the Custom Resource'.format(resource))
                cfn.send(event, context, 'FAILED',{},context.log_stream_name)

            cfn.send(event, context, 'SUCCESS', responseData, id)

        elif request == 'Delete':

            if resource == 'MediaLiveChannel':
                MediaLive.delete_channel(event['PhysicalResourceId'])

            elif resource == 'MediaPackageChannel':
                    MediaPackage.delete_channel(event['PhysicalResourceId'])

            elif resource == 'DemoConsole':
                Demo.s3_delete(config)

            else:
                #medialive inputs and mediapackage endpoints are deleted as part of
                #the the channel deletes so not included here, sending default success response
                print('RESPONSE:: {} : delte not required, sending success response'.format(resource))

            cfn.send(event, context, 'SUCCESS',{})

        else:
            print('RESPONSE:: {} Not supported'.format(request))

    except Exception as e:
        print('Exception: {}'.format(e))
        cfn.send(event, context, 'FAILED',{},context.log_stream_name)
        print (e)
