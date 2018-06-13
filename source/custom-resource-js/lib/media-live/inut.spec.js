
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
let path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./input.js');

describe('MEDIALIVE', function() {

  let _config = {
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

  let _data = {
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

  describe('#MEDIALIVE INPUT TEST', function() {

    beforeEach(function() {
      process.env.AWS_REGION = 'us-east-1'
    });

    afterEach(function() {
      AWS.restore('MediaLive');
    });

		it('should return "responseData" when create PULL input is successful', function(done) {

			AWS.mock('SSM', 'putParameter');

			AWS.mock('MediaLive', 'createInput', function(params, callback) {
				callback(null, _data);
			});

			lambda.createPullInput(_config)
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
        callback(null, _data);
      });
      AWS.mock('MediaLive', 'createInput', function(params, callback) {
        callback(null, _data);
      });

      lambda.createPushInput(_config)
        .then(responseData => {
          expect(responseData.EndPoint1).to.equal('http://123:5000');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    it('should return "sucess" when DELETE input is successful', function(done) {

      AWS.mock('MediaLive', 'deleteInput', function(params, callback) {
        callback(null, _data);
      });

      lambda.deleteInput('123456')
        .then(() => {
          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});
