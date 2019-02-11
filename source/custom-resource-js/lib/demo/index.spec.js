let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./index.js');

let _config = {
  DemoBucket:'DemoBucket',
  SrcBucket: 'SrcBucket',
  SrcPath: 'SrcPath',
  Exports: 'Exports'
}

describe('#DEMO::', () => {

	afterEach(() => {
    AWS.restore('S3');
	});

	it('should return "responseData" on S3 Deploy  sucess', async () => {

		AWS.mock('S3', 'copyObject', Promise.resolve());
    AWS.mock('S3', 'putObject', Promise.resolve());

    let response = await lambda.s3Deploy(_config)
    expect(response).to.equal('success');
	});

  it('should return "ERROR" s3 copy Object', async () => {

    AWS.mock('S3', 'copyObject', Promise.reject('ERROR'));

    await lambda.s3Deploy(_config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });

  it('should return "responseData" on S3 Delete  sucess', async () => {

		AWS.mock('S3', 'deleteObjects', Promise.resolve());
    AWS.mock('S3', 'deleteBucket', Promise.resolve());

    let response = await lambda.s3Delete(_config)
    expect(response).to.equal('success');
	});

  it('should return "ERROR" s3 delete Object', async () => {

    AWS.mock('S3', 'deleteObjects',Promise.reject('ERROR'));

    await lambda.s3Delete(_config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });

});
