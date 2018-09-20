let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./index.js');

let _config = {
  ChannelId:'test',
  EndPoint: 'HLS',
  Url:'http://test.com/123'
}
let data = {
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
let ChannelId = 'test';
let end_data = [
  {Id:'111'}
];

describe('#MEDIAPACKAGE::', () => {

	afterEach(() => {
    AWS.restore('MediaPackage');
    AWS.restore('SSM');
	});

	it('should return "responseData" on mediapackage create EndPoint', async () => {

		AWS.mock('MediaPackage', 'createOriginEndpoint', Promise.resolve(data));

		lambda.createEndPoint	(_config,(err, responseData) => {
				expect(responseData.DomainName).to.equal('test.com');
		});
	});

	it('should return "responseData" on mediapackage create Channel', async () => {

		AWS.mock('MediaPackage', 'createChannel', Promise.resolve(data));
    AWS.mock('SSM', 'putParameter');

		lambda.createChannel(_config,(err, responseData) => {
					expect(responseData.Url).to.equal('http://test/');
		});
	});

  it('should return "responseData" on mediapackage delete channel',async () => {

		AWS.mock('MediaPackage', 'listOriginEndpoints', Promise.resolve(data));
    AWS.mock('MediaPackage', 'deleteOriginEndpoint');
    AWS.mock('MediaPackage', 'deleteChannel');

		lambda.deleteChannel	(ChannelId,(err, responseData) => {
				expect(responseData).to.equal('success');
		});
	});

});
