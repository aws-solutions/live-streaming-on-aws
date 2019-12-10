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

import datetime
import json
import urllib.request

def send_metrics(config):
    metrics = {}
    metrics['Solution'] = config['SolutionId']
    metrics['UUID'] = config['UUID']
    metrics['TimeStamp'] = str(datetime.datetime.utcnow().isoformat())
    metrics['Data'] = config
    url = 'https://metrics.awssolutionsbuilder.com/generic'
    data = json.dumps(metrics).encode('utf8')
    headers = {'content-type': 'application/json'}
    req = urllib.request.Request(url, data,headers)
    response = urllib.request.urlopen(req)
    print('RESPONSE CODE:: {}'.format(response.getcode()))
    print('METRICS SENT:: {}'.format(data))
    return
