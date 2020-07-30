/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
const expect = require('chai').expect;
const path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lambda = require('./index.js');

const pull_config = {
  StreamName:'test',
  Type: 'URL_PULL',
  PriUrl:'http://abc/123',
  SecUrl:'http://def/456',
  PriUser:'user1',
  PriPass: 'pass1',
  SecUser: 'user2',
  SecPass: 'pass2',
  InputId: '2468'
};
const push_config = {
  StreamName:'test',
  Type: 'RTP_PUSH',
  Cidr: '0.0.0.0/0'
};
const input_data = {
  SecurityGroup: {
    Id:'1357'
  },
  Input:{
    Id:'2468',
    Destinations: [
      {Url:'http://123:5000'},
      {Url:'http://456:5000'}
    ]
  }
};
const config = {
  Codec:'AVC',
  Name: 'test',
  InputId: '1357',
  EncodingProfile: 'HD-1080p',
  Role: 'arn:aws:iam::12345:role/test',
  ChannelId:'2468'
};
const data = {
  State:'IDLE',
  ChannelId: '12345',
  Channel: {
    Id:'2468'
  },
  SecurityGroup: {
    Id:'1357'
  },
  Input:{
    Id:'2468',
    Destinations: [
      {Url:'http://123:5000'}
    ]
  }
};

describe('#MEDIALIVE::', () => {

	afterEach(() => {
    AWS.restore('MediaLive');
    AWS.restore('SSM');
	});

	it('should return "responseData" when create PULL INPUT is successful', async () => {
		AWS.mock('MediaLive', 'createInput', Promise.resolve(input_data));
    AWS.mock('SSM', 'putParameter');
    const response = await lambda.createInput(pull_config)
    expect(response.Id).to.equal('2468');
	});
  it('should return "ERROR" on MediaLive create PULL INPUT', async () => {
    AWS.mock('SSM', 'putParameter');
    AWS.mock('MediaLive', 'createInput', Promise.reject('ERROR'));
    await lambda.createInput(pull_config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });
  it('should return "responseData" when create PUSH INPUT is successful', async () => {
    AWS.mock('MediaLive', 'createInputSecurityGroup', Promise.resolve(input_data));
		AWS.mock('MediaLive', 'createInput', Promise.resolve(input_data));
    const response = await lambda.createInput(push_config)
    expect(response.Id).to.equal('2468');
	});
  it('should return "ERROR" on MediaLive create PUSH INPUT', async () => {
    AWS.mock('MediaLive', 'createInputSecurityGroup', Promise.resolve(input_data));
    AWS.mock('MediaLive', 'createInput', Promise.reject('ERROR'));
    await lambda.createInput(push_config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });
  it('CREATE CHANNEL SUCCESS',async () => {
    AWS.mock('MediaLive', 'createChannel', Promise.resolve(data));
    AWS.mock('MediaLive', 'waitFor', Promise.resolve());
    const response = await lambda.createChannel(config)
    expect(response.ChannelId).to.equal('2468');
  });
  it('CREATE CHANNEL ERROR', async () => {
    AWS.mock('MediaLive', 'createChannel', Promise.reject('ERROR'));
    await lambda.createChannel(config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });
  it('START CHANNEL SUCCESS', async () => {
    AWS.mock('MediaLive', 'startChannel', Promise.resolve(data));
    const response = await lambda.startChannel(config)
    expect(response).to.equal('success');
  });
  it('START CHANNEL ERROR', async () => {
    AWS.mock('MediaLive', 'startChannel', Promise.reject('ERROR'));
    await lambda.startChannel(config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });
  it('DELETE CHANNEL SUCCESS', async () => {
    AWS.mock('MediaLive', 'stopChannel', Promise.resolve());
    AWS.mock('MediaLive', 'waitFor', Promise.resolve());
    AWS.mock('MediaLive', 'deleteChannel', Promise.resolve());
    AWS.mock('MediaLive', 'waitFor', Promise.resolve());
    const response = await lambda.deleteChannel('1234')
    expect(response).to.equal('success');
  });
  it('DELETE CHANNEL ERROR', async () => {
    AWS.mock('MediaLive', 'stopChannel', Promise.resolve());
    AWS.mock('MediaLive', 'waitFor', Promise.resolve());
    AWS.mock('MediaLive', 'deleteChannel', Promise.reject('ERROR'));
    await lambda.deleteChannel('1234').catch(err => {
      expect(err).to.equal('ERROR');
    });
  });

});
