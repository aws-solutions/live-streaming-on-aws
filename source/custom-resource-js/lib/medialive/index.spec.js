let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./index.js');
let pull_config = {
  StreamName:'test',
  Type: 'URL_PULL',
  PriUrl:'http://abc/123',
  SecUrl:'http://def/456',
  PriUser:'user1',
  PriPass: 'pass1',
  SecUser: 'user2',
  SecPass: 'pass2',
  InputId: '2468'
}
let push_config = {
  StreamName:'test',
  Type: 'RTP_PUSH',
  Cidr: '0.0.0.0/0'
}
let channel_config = {
  Codec:'MPEG2',
  Name: 'test',
  InputId: '1357',
  Resolution: '1080',
  Role: 'arn:aws:iam::12345:role/test',
  MediaPackagePriUrl:'http://abc/123',
  MediaPackagePriUser:'user1',
  MediaPackageSecUrl:'http://def/456',
  MediaPackageSecUser:'user2',
  ChannelId:'2468'
}
let input_data = {
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
let sg_data = {
  SecurityGroup:{
    Id:'1357'
  }
}
let channel_data = {
  Channel: {
    Id:'2468'
  }
}
let ChannelId = '2468'

let delete_data = {
  InputAttachments:[
    {
      InputId:'2468'
    }
  ]
}

describe('#MEDIALIVE::', () => {

	afterEach(() => {
    AWS.restore('MediaLive');
    AWS.restore('SSM');
	});


	it('should return "responseData" when create input is successful', async () => {

		AWS.mock('MediaLive', 'createInput', Promise.resolve(input_data));
    AWS.mock('SSM', 'putParameter');

    let response = await lambda.createInput(pull_config)
    expect(response.Id).to.equal('2468');
	});

  it('should return "ERROR" on MediaLive create input', async () => {

    AWS.mock('SSM', 'putParameter');
    AWS.mock('MediaLive', 'createInput', Promise.reject('ERROR'));

    await lambda.createInput(pull_config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });

  it('should return "responseData" when create Channel is successful',async () => {

    AWS.mock('MediaLive', 'createChannel', Promise.resolve(channel_data));

    let response = await lambda.createChannel(channel_config)
    expect(response.ChannelId).to.equal('2468');
	});

  it('should return "ERROR" on MediaLive create Channel', async () => {

    AWS.mock('MediaLive', 'createChannel', Promise.reject('ERROR'));

    await lambda.createChannel(channel_config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });

});
