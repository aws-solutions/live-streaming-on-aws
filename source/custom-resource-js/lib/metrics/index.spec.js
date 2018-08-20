const axios = require('axios');
const expect = require('chai').expect;
const MockAdapter = require('axios-mock-adapter');

let lambda = require('./index.js');

let _config = {
		SolutionId: 'SO0021',
		UUID: '999-999'
	}

describe('#SEND METRICS', () => {

	it('should return "200" on a send metrics sucess', async () => {

		let mock = new MockAdapter(axios);
		mock.onPost().reply(200, {});

		lambda.send(_config, (err, data) => {
				expect(data).to.equal(200);
		});
	});
});
