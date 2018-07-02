
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
let path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./index.js');

describe('MEDIAPACKAGE', function() {

  let _config = {
		ChannelId:'test',
    EndPoint: 'HLS',
    Url:'http://test.com/abcd/123'
  }

  let data = {
    Url:'http://test.com/abcd/123',
    HlsIngest:{
      IngestEndpoints:[
        {
          Username:'name',
          Password:'password',
          Url:'http://test/'
        }
      ]
    },
    OriginEndpoints:[
       {
         Id:'test-hls'
       }
     ]
  };

  let ChannelId = 'test';

  describe('#MEDIAPACKAGE CHANNEL TEST', function() {

    beforeEach(function() {
      process.env.AWS_REGION = 'us-east-1'
    });

    afterEach(function() {
      AWS.restore('MediaPackage');
      AWS.restore('SSM');
    });

    it('should return "responseData" when create HLS Endpoint is successful', function(done) {

      AWS.mock('MediaPackage', 'createOriginEndpoint', function(params, callback) {
        callback(null, data);
      });

      AWS.mock('SSM', 'putParameter');

      lambda.createEndPoint(_config)
        .then(responseData => {
          expect(responseData.DomainName).to.equal('test.com');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    it('should return "responseData" when createchannel is successful', function(done) {

      AWS.mock('MediaPackage', 'createChannel', function(params, callback) {
        callback(null, data);
      });

      AWS.mock('SSM', 'putParameter');

      lambda.createChannel(_config)
        .then(responseData => {
          expect(responseData.Url).to.equal('http://test/');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    it('should return "data" when deletechannel is successful', function(done) {

      AWS.mock('MediaPackage', 'listOriginEndpoints', function(params, callback) {
        callback(null, data);
      });
      AWS.mock('MediaPackage', 'deleteOriginEndpoint');
      AWS.mock('MediaPackage', 'deleteChannel');

      lambda.deleteChannel(ChannelId)
        .then(() => {
          done();
        })
        .catch(err => {
          done(err);
        });
    });

  });
});
