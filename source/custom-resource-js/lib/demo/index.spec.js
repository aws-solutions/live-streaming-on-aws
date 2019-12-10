/*******************************************************************************
*  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
*
*  Licensed under the Apache License Version 2.0 (the "License"). You may not 
*  use this file except in compliance with the License. A copy of the License is 
*  located at                                                           
*
*      http://www.apache.org/licenses/
*
*  or in the "license" file accompanying this file. This file is distributed on  
*  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or 
*  implied. See the License for the specific language governing permissions and  
*  limitations under the License.      
********************************************************************************/

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
