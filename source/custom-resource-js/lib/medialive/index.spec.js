
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
let path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./index.js');

describe('MEDIALIVE', function() {


  let input_config = {
		StreamName:'test',
		Type: 'URL_PULL',
		Cidr: '0.0.0.0/0',
		PriUrl:'http://abc/123',
		SecUrl:'http://def/456',
		PriUser:'user1',
		PriPass: 'pass1',
		SecUser: 'user2',
		SecPass: 'pass2',
    InputId: '2468'
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

  let channel_config = {
		Codec:'MPEG2',
    Name: 'test',
    InputId: '1357',
    Resolution: '1080',
    Role: 'arn:aws:iam::12345:role/test',
		MediaPackagePriUrl:'http://abc/123',
		MediaPackagePriUser:'user1',
		MediaPackagePriPassParam: 'pass1',
    ChannelId:'2468'
  }

  let channel_data = {
		Channel: {
			Id:'2468'
		}
  }

  describe('#MEDIALIVE CHANNEL TEST', function() {

    beforeEach(function() {
      process.env.AWS_REGION = 'us-east-1'
    });

    afterEach(function() {
      AWS.restore('MediaLive');
    });

    it('should return "responseData" when create PULL input is successful', function(done) {

			AWS.mock('SSM', 'putParameter');

			AWS.mock('MediaLive', 'createInput', function(params, callback) {
				callback(null, input_data);
			});

			lambda.createPullInput(input_config)
				.then(responseData => {
					expect(responseData.Id).to.equal('2468');
					done();
				})
				.catch(err => {
					done(err);
				});
		});

    it('should return "responseData" when create PUSH input is successful', function(done) {

			AWS.mock('MediaLive', 'createInputSecurityGroup', function(params, callback) {
        callback(null, input_data);
      });
      AWS.mock('MediaLive', 'createInput', function(params, callback) {
        callback(null, input_data);
      });

      lambda.createPushInput(input_config)
        .then(responseData => {
          expect(responseData.EndPoint1).to.equal('http://123:5000');
          done();
        })
        .catch(err => {
          done(err);
        });
    });

		it('should return "responseData" when create channel is successful', function(done) {

			AWS.mock('MediaLive', 'createChannel', function(params, callback) {
				callback(null, channel_data);
			});

			lambda.createChannel(channel_config)
				.then(responseData => {
					expect(responseData.ChannelId).to.equal('2468');
					done();
				})
				.catch(err => {
					done(err);
				});
		});
    it('should return "responseData" when delete input is successful', function(done) {

      AWS.mock('MediaLive', 'stopChannel', function(params, callback) {
        callback(null, channel_data);
      });
      AWS.mock('MediaLive', 'deleteChannel', function(params, callback) {
        callback(null, channel_data);
      });
      AWS.mock('MediaLive', 'deleteChannel', function(params, callback) {
        callback(null, channel_data);
      });

      lambda.deleteChannel('2468')
        .then(() => {
          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});
