/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

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
