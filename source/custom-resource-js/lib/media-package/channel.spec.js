
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
let path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./channel.js');

describe('MEDIAPACKAGE', function() {

  let _config = {
		ChannelId:'test'
  }

  let data = {
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

  describe('#MEDIAPACKAGE CHANNEL TEST', function() {

    beforeEach(function() {
      process.env.AWS_REGION = 'us-east-1'
    });

    afterEach(function() {
      AWS.restore('MediaPackage');
      AWS.restore('SSM');
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

      lambda.deleteChannel(_config)
        .then(() => {
          done();
        })
        .catch(err => {
          done(err);
        });
    });

  });
});
