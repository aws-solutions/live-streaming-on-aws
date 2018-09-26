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

import json
from urllib.parse import urlparse
import boto3
import time
medialive = boto3.client('medialive')
ssm = boto3.client('ssm')
responseData = {}


def create_push_input(config):
    sg = medialive.create_input_security_group(
        WhitelistRules=[
            {
                'Cidr': config['Cidr']
            }
        ]
    )

    #Feature/xxxx RTMP Requires Stream names for each input Destination.
    if config['Type'] == 'RTMP_PUSH':
        Destination = [
            {
                'StreamName': config['StreamName']+'primary'
            },
            {
                'StreamName': config['StreamName']+'secondary'
            }
        ]
    else:
        Destination = []

    response = medialive.create_input(
        InputSecurityGroups=[
            sg['SecurityGroup']['Id'],
        ],
        Name = config['StreamName'],
        Destinations= Destination,
        Type=config['Type']
    )
    responseData['Id'] = response['Input']['Id']
    responseData['EndPoint1'] = response['Input']['Destinations'][0]['Url']
    responseData['EndPoint2'] = response['Input']['Destinations'][1]['Url']
    print('RESPONSE::{}'.format(responseData))
    return responseData


def create_pull_input(config):
    Name = config['StreamName']
    Sources = [
        {
            'Url': config['PriUrl']
        },
        {
            'Url': config['PriUrl']
        }
    ]
    Type = config['Type']
    # store input u/p in SSM
    if config['PriUser']:
        Sources[0]['Username'] = config['PriUser']
        #Sources[0]['Username'] = config['PriUser']
        ssm.put_parameter(
            Name = config['PriUser'],
            Description = 'Live Stream solution Primary input credentials',
            Type = 'string',
            Value = config['PriPass']
        )
    # store input u/p in SSM
    if config['SecUser']:
        Sources[1]['Username'] = config['SecUser']
        #Sources[1]['Username'] = config['SecUser']
        ssm.put_parameter(
            Name = config['PriUser'],
            Description = 'Live Stream solution Primary input credentials',
            Type = 'string',
            Value = config['PriPass']
        )
    response = medialive.create_input(
        Name = Name,
        Type = Type,
        Sources = Sources
    )
    responseData['Id'] = response['Input']['Id']
    responseData['EndPoint1'] = 'Push InputType only'
    responseData['EndPoint2'] = 'Push InputType only'
    print('RESPONSE::{}'.format(responseData))
    return responseData


def create_channel(config):
    # set InputSpecification based on the input resolution:
    if config['Resolution'] == '1080':
        res = 'HD'
        bitrate = 'MAX_20_MBPS'
        profile = './encoding-profiles/medialive-1080p.json'
    elif config['Resolution'] == '720':
        res = 'HD'
        bitrate = 'MAX_10_MBPS'
        profile = './encoding-profiles/medialive-720p.json'
    else:
        res = 'SD'
        bitrate = 'MAX_10_MBPS'
        profile = './encoding-profiles/medialive-540p.json'

    #hotfix/V52152945 loop only supported in HLS_PULL
    if config['Type'] == 'URL_PULL':
        settings = {
            'SourceEndBehavior': 'LOOP'
        }
    else:
        settings = {}

    with open(profile) as encoding:
        EncoderSettings = json.load(encoding)

    response = medialive.create_channel(
        InputSpecification = {
            'Codec': config['Codec'],
            'Resolution':res,
            'MaximumBitrate':bitrate
        },
        InputAttachments = [{
            'InputId': config['InputId'],
            'InputSettings': settings
        }],
        Destinations = [{
            'Id': "destination1",
            'Settings': [
                {
                    'PasswordParam': config['MediaPackagePriUser'],
                    'Url': config['MediaPackagePriUrl'],
                    'Username': config['MediaPackagePriUser']
                },
                {
                    'PasswordParam': config['MediaPackageSecUser'],
                    'Url': config['MediaPackageSecUrl'],
                    'Username': config['MediaPackageSecUser']
                }
            ]
        }],
        Name = config['Name'],
        RoleArn = config['Role'],
        EncoderSettings = EncoderSettings,
    )
    responseData['ChannelId'] = response['Channel']['Id']
    print('RESPONSE::{}'.format(responseData))
    return responseData


def delete_channel(ChannelId):
    medialive.stop_channel(
        ChannelId = ChannelId
    )
    response = medialive.delete_channel(
        ChannelId = ChannelId
    )
    InputId = response['InputAttachments'][0]['InputId']
    # wait for channel delete so that the input state is detached:
    while True:
        state = medialive.describe_input(
            InputId=InputId
        )
        if state['State'] == 'DETACHED':
            break
        else:
            time.sleep(3)
    medialive.delete_input(
        InputId = InputId
    )
    return
