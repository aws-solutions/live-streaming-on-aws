
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
let path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./channel.js');

describe('MEDIALIVE', function() {

  let _config = {
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

  let _data = {
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

		it('should return "responseData" when create channel is successful', function(done) {

			AWS.mock('MediaLive', 'createChannel', function(params, callback) {
				callback(null, _data);
			});

			lambda.createChannel(_config)
				.then(responseData => {
					expect(responseData.ChannelId).to.equal('2468');
					done();
				})
				.catch(err => {
					done(err);
				});
		});
    it('should return "responseData" when delete input is successful', function(done) {

			AWS.mock('MediaLive', 'deleteChannel', function(params, callback) {
        callback(null, _data);
      });

      lambda.deleteChannel('123456')
        .then(() => {
          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});
