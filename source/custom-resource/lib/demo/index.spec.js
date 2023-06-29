// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const assert = require('chai').assert;
const expect = require('chai').expect;
const path = require('path');

let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lambda = require('./index.js');

describe('#S3::', () => {

  const config = {
    srcBucket:'srcBucket', 
    srcPath:'srcPath', 
    manifestFile:'manifestFile', 
    destBucket:'destBucket',
    awsExport: 'filebody'
  }
  const getData = {Body:"[\"console/file1\",\"console/file2\"]"};

  const listData = {
    Contents:[{
      Key:'test.txt'
    }]
  };

	afterEach(() => {
    AWS.restore('S3');
  });


  it('should return "success" on copyAssets sucess', async () => {
    AWS.mock('S3', 'getObject', Promise.resolve(getData));
    AWS.mock('S3', 'copyObject', Promise.resolve({}));
    AWS.mock('S3', 'putObject', Promise.resolve());
    const response = await lambda.copyAssets(config)
    expect(response).to.equal('success');
	});
  it('should return "ERROR" on copyAssets failure', async () => {
    AWS.mock('S3', 'getObject', Promise.reject('ERROR'));
    await lambda.copyAssets(config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });
  it('should return "success" on delAssets sucess', async () => {
    AWS.mock('S3', 'listObjects', Promise.resolve(listData));
    AWS.mock('S3', 'deleteObjects', Promise.resolve());
    const response = await lambda.delAssets(config)
    expect(response).to.equal('success');
  });
  it('should return "ERROR" on delAssets failure', async () => {
    AWS.mock('S3', 'listObjects', Promise.reject('ERROR'));
    await lambda.delAssets(config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });
});
