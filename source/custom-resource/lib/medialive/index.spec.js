// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const expect = require('chai').expect;
const { mockClient } = require('aws-sdk-client-mock');
const {
  MediaLiveClient,
  CreateInputCommand,
  DeleteInputCommand,
  DescribeInputCommand,
  CreateInputSecurityGroupCommand,
  DeleteInputSecurityGroupCommand,
  DescribeInputSecurityGroupCommand,
  CreateChannelCommand,
  StartChannelCommand,
  StopChannelCommand,
  DeleteChannelCommand
} = require('@aws-sdk/client-medialive');
const { 
  SSMClient, 
  PutParameterCommand 
} = require('@aws-sdk/client-ssm');

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
const rtmp_push_config = {
  StreamName: 'test',
  Type: 'RTMP_PUSH',
  Cidr: '0.0.0.0/0'
};
const mediaconnect_config = {
  StreamName: 'test',
  Type: 'MEDIACONNECT',
  RoleArn: 'arn:aws:iam::12345:role/test',
  PriMediaConnectArn: 'arn:aws:mediaconnect:us-west-2:12345:flow:1-abcd:Pri',
  SecMediaConnectArn: 'arn:aws:mediaconnect:us-west-2:12345:flow:1-abcd:Sec'
};
const invalid_config = {
  Type: 'Invalid'
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

  const mediaLiveClientMock = mockClient(MediaLiveClient);
  const ssmClientMock = mockClient(SSMClient);

	it('should return "responseData" when create PULL INPUT is successful', async () => {
    mediaLiveClientMock.on(CreateInputCommand).resolves(input_data);
    ssmClientMock.on(PutParameterCommand).resolves();
    const response = await lambda.createInput(pull_config)
    expect(response.Id).to.equal('2468');
	});
  it('should return "ERROR" on MediaLive create PULL INPUT', async () => {
    mediaLiveClientMock.on(CreateInputCommand).rejects('ERROR');
    await lambda.createInput(pull_config).catch(err => {
      expect(err.toString()).to.equal('Error: ERROR');
    });
  });
  it('should return "responseData" when create PUSH INPUT is successful', async () => {
    mediaLiveClientMock.on(CreateInputSecurityGroupCommand).resolves(input_data);
    mediaLiveClientMock.on(CreateInputCommand).resolves(input_data);
    const response = await lambda.createInput(push_config)
    expect(response.Id).to.equal('2468');
	});
  it('should return "ERROR" on MediaLive create PUSH INPUT', async () => {
    mediaLiveClientMock.on(CreateInputCommand).rejects('ERROR');
    await lambda.createInput(push_config).catch(err => {
      expect(err.toString()).to.equal('Error: ERROR');
    });
  });
  it('should return "responseData" when create RTMP PUSH INPUT is successful', async () => {
    mediaLiveClientMock.on(CreateInputCommand).resolves(input_data);
    const response = await lambda.createInput(rtmp_push_config)
    expect(response.Id).to.equal('2468');
	});
  it('should return "ERROR" on MediaLive create RTMP PUSH INPUT', async () => {
    mediaLiveClientMock.on(CreateInputCommand).rejects('ERROR');
    await lambda.createInput(rtmp_push_config).catch(err => {
      expect(err.toString()).to.equal('Error: ERROR');
    });
  });
  it('should return "responseData" when create MEDIACONNECT INPUT is successful', async () => {
    mediaLiveClientMock.on(CreateInputCommand).resolves(input_data);
    const response = await lambda.createInput(mediaconnect_config)
    expect(response.Id).to.equal('2468');
	});
  it('should return "ERROR" on MediaLive create MEDIACONNECT INPUT', async () => {
    mediaLiveClientMock.on(CreateInputCommand).rejects('ERROR');
    await lambda.createInput(mediaconnect_config).catch(err => {
      expect(err.toString()).to.equal('Error: ERROR');
    });
  });
  it('should return "input type not defined in request" on MediaLive create Invalid INPUT', async () => {
    mediaLiveClientMock.on(CreateInputCommand).resolves(input_data);
    await lambda.createInput(invalid_config).catch(err => {
      expect(err).to.equal('input type not defined in request');
    });
  });
  it('CREATE CHANNEL SUCCESS',async () => {
    mediaLiveClientMock.on(CreateChannelCommand).resolves(data);
    const response = await lambda.createChannel(config)
    expect(response.ChannelId).to.equal('2468');
  });
  it('CREATE CHANNEL ERROR', async () => {
    mediaLiveClientMock.on(CreateChannelCommand).rejects('ERROR');
    await lambda.createChannel(config).catch(err => {
      expect(err.toString()).to.equal('Error: ERROR');
    });
  });
  it('START CHANNEL SUCCESS', async () => {
    mediaLiveClientMock.on(StartChannelCommand).resolves(data);
    const response = await lambda.startChannel(config)
    expect(response).to.equal('success');
  });
  it('START CHANNEL ERROR', async () => {
    mediaLiveClientMock.on(StartChannelCommand).rejects('ERROR');
    await lambda.startChannel(config).catch(err => {
      expect(err.toString()).to.equal('Error: ERROR');
    });
  });
  it('DELETE CHANNEL SUCCESS', async () => {
    mediaLiveClientMock.on(StopChannelCommand).resolves();
    mediaLiveClientMock.on(DeleteChannelCommand).resolves();
    const response = await lambda.deleteChannel('1234')
    expect(response).to.equal('success');
  });
  it('DELETE CHANNEL ERROR', async () => {
    mediaLiveClientMock.on(DeleteChannelCommand).rejects('ERROR');
    await lambda.deleteChannel('1234').catch(err => {
      expect(err.toString()).to.equal('Error: ERROR');
    });
  });
  it('DELETE INPUT SUCCESS', async () => {
    mediaLiveClientMock.on(DescribeInputCommand).resolves(input_data);
    mediaLiveClientMock.on(DeleteInputCommand).resolves();
    mediaLiveClientMock.on(DescribeInputSecurityGroupCommand).resolves();
    mediaLiveClientMock.on(DeleteInputSecurityGroupCommand).resolves();
    const response = await lambda.deleteInput('1357')
    expect(response).to.equal('success');
  });

});
