'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
let path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./endpoint.js');

describe('MEDIAPACKAGE', function() {

  let _config = {
		ChannelId:'test'
  }

  let data = {
		Url:'http://test/'
  };

  describe('#MEDIAPACKAGE ENDPOINT TEST', function() {

    beforeEach(function() {
      process.env.AWS_REGION = 'us-east-1'
    });

    afterEach(function() {
      AWS.restore('MediaPackage');
    });

    it('should return "responseData" when create HLS Endpoint is successful', function(done) {

      AWS.mock('MediaPackage', 'createOriginEndpoint', function(params, callback) {
        callback(null, data);
      });

      AWS.mock('SSM', 'putParameter');

      lambda.createHlsEndPoint(_config)
        .then(responseData => {
          expect(responseData.Url).to.equal('http://test/');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
		it('should return "responseData" when create DASH Endpoint is successful', function(done) {

			AWS.mock('MediaPackage', 'createOriginEndpoint', function(params, callback) {
				callback(null, data);
			});

			AWS.mock('SSM', 'putParameter');

			lambda.createDashEndPoint(_config)
				.then(responseData => {
					expect(responseData.Url).to.equal('http://test/');
					done();
				})
				.catch(err => {
					done(err);
				});
		});
		it('should return "responseData" when create MSS Endpoint is successful', function(done) {

			AWS.mock('MediaPackage', 'createOriginEndpoint', function(params, callback) {
				callback(null, data);
			});

			AWS.mock('SSM', 'putParameter');

			lambda.createMssEndPoint(_config)
				.then(responseData => {
					expect(responseData.Url).to.equal('http://test/');
					done();
				})
				.catch(err => {
					done(err);
				});
		});
  });
});
