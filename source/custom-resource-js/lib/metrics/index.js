// https.request rapped in a promise to send Anonymous Metric back to AWS.

const https = require('https');
const moment = require('moment');

let Send = function(event) {
	let response = new Promise((res, reject) => {

		let now = moment().utc().format('YYYY-MM-DD HH:mm:ss.S');

		let metrics = {
			Solution: event.ResourceProperties.SolutionId,
			UUID: event.ResourceProperties.UUID,
			TimeStamp: now,
			Data: event.ResourceProperties
		};

		// Remove unwanted data and set request type Create/Update/Delete
		delete metrics.Data.ServiceToken;
		metrics.Data[event.RequestType] = now;

		let options = {
			//hostname: 'metrics.awssolutionsbuilder.com',
			hostname: 'https://oszclq8tyh.execute-api.us-east-1.amazonaws.com',
			port: 443,
			//path: '/generic',
			path: '/prod/generic',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		};

		let request = https.request(options, (data) => {
			res(data.statusCode);
		});
		request.on('error', (err) => {
			console.error(err);
			reject(err);
		});
		request.write(metrics);
		request.end();
	});
	return response;
};

module.exports = {
	send: Send
};
