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
const expect = require('chai').expect;
const path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lambda = require('./index.js');

const _config = {
  ChannelId:'test',
  EndPoint: 'HLS',
  Url:'http://test.com/123',
  CdnIdentifierSecret: 'CdnIdentifierSecret',
  SecretsRoleArn:'SecretsRoleArn'
}
const data = {
  Arn:'mediapackage-arn',
  Url:'http://test.com/123',
  HlsIngest:{
    IngestEndpoints:[
      {
        Username:'name',
        Password:'password',
        Url:'http://test/'
      },
      {
        Username:'name2 ',
        Password:'password2',
        Url:'http://test2/'
      }
    ]
  },
  OriginEndpoints:[
     {
       Id:'test-hls'
     }
   ]
};
const ChannelId = 'test';


describe('#MEDIAPACKAGE::', () => {

	afterEach(() => {
    AWS.restore('MediaPackage');
    AWS.restore('SSM');
	});

	it('should return "responseData" on mediapackage create EndPoint', async () => {
		AWS.mock('MediaPackage', 'createOriginEndpoint', Promise.resolve(data));
		const response = await lambda.createEndPoint(_config);
    expect(response.DomainName).to.equal('test.com');
	});
  it('should return "ERROR" on mediapackage create EndPoint', async () => {
    AWS.mock('MediaPackage', 'createOriginEndpoint', Promise.reject('ERROR'));
    await lambda.createEndPoint(_config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });
	it('should return "responseData" on mediapackage create Channel', async () => {
		AWS.mock('MediaPackage', 'createChannel', Promise.resolve(data));
    AWS.mock('SSM', 'putParameter');
    AWS.mock('SSM', 'putParameter');
		const response = await lambda.createChannel(_config)
		expect(response.Arn).to.equal('mediapackage-arn');
	});
  it('should return "ERROR" on mediapackage create Channel', async () => {
    AWS.mock('MediaPackage', 'createChannel', Promise.reject('ERROR'));
    AWS.mock('SSM', 'putParameter');
    await lambda.createChannel(_config).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });
  it('should return "responseData" on mediapackage delete channel',async () => {
		AWS.mock('MediaPackage', 'listOriginEndpoints', Promise.resolve(data));
    AWS.mock('MediaPackage', 'deleteOriginEndpoint');
    AWS.mock('MediaPackage', 'deleteChannel');
    const response = await lambda.deleteChannel(ChannelId)
    expect(response).to.equal('success');
	});
  it('should return "ERROR" on mediapackage delete Channel', async () => {
    AWS.mock('MediaPackage', 'listOriginEndpoints', Promise.reject('ERROR'));
    await lambda.deleteChannel(ChannelId).catch(err => {
      expect(err).to.equal('ERROR');
    });
  });

});
