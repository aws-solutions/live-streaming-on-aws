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

		lambda.s3Deploy	(_config,(err, responseData) => {
				expect(responseData).to.equal('sucess');
		});
	});

  it('should return "responseData" on S3 Delete  sucess', async () => {

		AWS.mock('S3', 'deleteObjects', Promise.resolve());
    AWS.mock('S3', 'deleteBucket', Promise.resolve());

		lambda.s3Delete	(_config,(err, responseData) => {
				expect(responseData).to.equal('sucess');
		});
	});


});
