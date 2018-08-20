const axios = require('axios');
const expect = require('chai').expect;
const MockAdapter = require('axios-mock-adapter');

let lambda = require('./index.js');

  let _event = {
    RequestType: "Create",
    ServiceToken: "arn:aws:lambda",
    ResponseURL: "https://cloudformation.s3.amazonaws.com/",
    StackId: "arn:aws:cloudformation",
    RequestId: "111111",
    LogicalResourceId: "Uuid",
    ResourceType: "Custom::UUID",
    ResourceProperties: {
        ServiceToken: "arn:aws:lambda",
        Resource: "UUID"
    }
  }
  let _context = {
    logStreamName: 'cloudwatch'
  }
  let responseStatus = 'ok'
  let responseData = {
    test: 'testing'
  }

  describe('#CFN RESONSE::',() => {

    it('should return "200" on a send cfn response sucess', async () => {

  		let mock = new MockAdapter(axios);
  		mock.onPut().reply(200, {});

  		lambda.send(_event, (err, data) => {
  				expect(data).to.equal(200);
  		});
  	});
});
