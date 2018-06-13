
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
let path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./demo-helper.js');

describe('DEMO', function() {

  let _config = {
		DemoBucket:'DemoBucket',
		SrcBucket: 'SrcBucket',
		SrcPath: 'SrcPath',
    Exports: 'Exports'
  }

  describe('#MEDIAPACKAGE CHANNEL TEST', function() {

    beforeEach(function() {
      process.env.AWS_REGION = 'us-east-1'
    });

    afterEach(function() {
      AWS.restore('S3');
    });

    it('should return "sucess" when Deploy is successful', function(done) {

      AWS.mock('S3', 'copyObject', function(params, callback) {
        callback(null, 'sucess');
      });
      AWS.mock('S3', 'putObject', function(params, callback) {
        callback(null, 'sucess');
      });

      lambda.s3Deploy(_config)
        .then(responseData => {
          expect(responseData).to.equal('sucess');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    it('should return "sucess" when S3Delete is successful', function(done) {

      AWS.mock('S3', 'deleteObjects', function(params, callback) {
        callback(null, 'sucess');
      });

      AWS.mock('S3', 'deleteBucket', function(params, callback) {
        callback(null, 'sucess');
      });

      lambda.s3Delete(_config)
        .then(responseData => {
          expect(responseData).to.equal('sucess');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});
