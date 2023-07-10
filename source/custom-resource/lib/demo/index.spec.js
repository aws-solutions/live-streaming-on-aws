/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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

const expect = require('chai').expect;

const { mockClient } = require('aws-sdk-client-mock');
const { 
  S3Client, 
  GetObjectCommand, 
  CopyObjectCommand, 
  PutObjectCommand, 
  ListObjectsCommand, 
  DeleteObjectsCommand
} = require('@aws-sdk/client-s3');

const lambda = require('./index.js');

describe('#S3::', () => {

  const config = {
    srcBucket:'srcBucket', 
    srcPath:'srcPath', 
    manifestFile:'manifestFile', 
    destBucket:'destBucket',
    awsExport: 'filebody'
  }
  const getData = {
    "Body": {
      transformToString: () => ('["asset-manifest.json","assets/favicon.ico","assets/apple-icon.png","assets/aws-exports.js","index.html","robots.txt","static/css/main.0b96ce14.css","static/css/main.0b96ce14.css.map","static/js/main.1b2a7f8e.js.LICENSE.txt","static/js/main.1b2a7f8e.js","static/js/main.1b2a7f8e.js.map"]')
    }
  };

  const listData = {
    Contents:[{
      Key:'test.txt'
    }]
  };

  const s3ClientMock = mockClient(S3Client);


  it('should return "success" on copyAssets sucess', async () => {
    s3ClientMock.on(GetObjectCommand).resolves(getData);
    s3ClientMock.on(CopyObjectCommand).resolves({});
    s3ClientMock.on(PutObjectCommand).resolves();
    const response = await lambda.copyAssets(config)
    expect(response).to.equal('success');
	});
  it('should return "ERROR" on copyAssets failure', async () => {
    s3ClientMock.on(GetObjectCommand).rejects('ERROR');
    await lambda.copyAssets(config).catch(err => {
      expect(err.toString()).to.equal('Error: ERROR');
    });
  });
  it('should return "success" on delAssets sucess', async () => {
    s3ClientMock.on(ListObjectsCommand).resolves(listData);
    s3ClientMock.on(DeleteObjectsCommand).resolves();
    const response = await lambda.delAssets(config)
    expect(response).to.equal('success');
  });
  it('should return "ERROR" on delAssets failure', async () => {
    s3ClientMock.on(ListObjectsCommand).rejects('ERROR');
    await lambda.delAssets(config).catch(err => {
      expect(err.toString()).to.equal('Error: ERROR');
    });
  });
});
