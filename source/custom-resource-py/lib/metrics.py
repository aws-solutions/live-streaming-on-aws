#!/usr/bin/python
# -*- coding: utf-8 -*-
##############################################################################
#  Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.   #
#                                                                            #
#  Licensed under the Amazon Software License (the "License"). You may not   #
#  use this file except in compliance with the License. A copy of the        #
#  License is located at                                                     #
#                                                                            #
#      http://aws.amazon.com/asl/                                            #
#                                                                            #
#  or in the "license" file accompanying this file. This file is distributed #
#  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,        #
#  express or implied. See the License for the specific language governing   #
#  permissions and limitations under the License.                            #
##############################################################################
# Custom resource to send Anonymous Metric back to AWS.
import datetime
import json
import urllib.request


def send_metrics(event):
    config = event['ResourceProperties']
    metrics = {}
    metrics['Solution'] = 'SO0013'
    metrics['UUID'] = config['UUID']
    metrics['TimeStamp'] = str(datetime.datetime.utcnow().isoformat())
    metrics['Data'] = config
    del metrics['Data']['ServiceToken']

    if event['RequestType'] == 'Create':
        metrics['Data']['Launched'] = str(datetime.datetime.utcnow().isoformat())

    if event['RequestType'] == 'Delete':
        metrics['Data']['Deleted'] = str(datetime.datetime.utcnow().isoformat())

    #url = 'https://metrics.awssolutionsbuilder.com/generic'
    url = 'https://oszclq8tyh.execute-api.us-east-1.amazonaws.com/prod/generic'
    data = json.dumps(metrics).encode('utf8')
    headers = {'content-type': 'application/json'}
    req = urllib.request.Request(url, data,headers)
    response = urllib.request.urlopen(req)
    print('RESPONSE CODE:: {}'.format(response.getcode()))
    print('METRICS SENT:: {}'.format(data))
    return
