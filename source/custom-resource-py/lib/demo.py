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

# console-manifest.json contains a list of all the files that make up the demo console.
# export.js is generated as part of the cloudformation deployment
import boto3
import json
s3 = boto3.client('s3')


def s3_deploy(config):
    with open('./console-manifest.json') as file:
        manifest = json.load(file)
        print('UPLOADING FILES::')
        for key in manifest:
            s3.copy_object(
                Bucket = config['DemoBucket'],
                CopySource = config['SrcBucket']+'/'+config['SrcPath'] + '/'+key,
                Key = key
            )
            print(key)
    print('CREATE EXPORT FILE::')
    response = s3.put_object(
        Bucket=config['DemoBucket'],
        Body=config['Exports'],
        Key='console/assets/js/exports.js'
    )
    print('RESPONSE::{}'.format(response))
    return


def s3_delete(config):
    with open('./console-manifest.json') as file:
        manifest = json.load(file)
        for key in manifest:
            s3.delete_object(
                Bucket=config['DemoBucket'],
                Key=key
            )
    s3.delete_object(
        Bucket=config['DemoBucket'],
        Key='console/assets/js/exports.js'
    )
    s3.delete_bucket(
        Bucket=config['DemoBucket']
    )
    print('RESPONSE:: Demo bucket and files delted')
    return
