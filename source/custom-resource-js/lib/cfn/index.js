// npm cfn response module does nto support Promise, which is requered for
//Async/Await. updated as a promise.

const https = require('https');
const url = require("url");

let Send = function(event, context, responseStatus, responseData, physicalResourceId) {
	let response = new Promise((res, reject) => {

		let responseBody = JSON.stringify({
			Status: responseStatus,
			Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
			PhysicalResourceId: physicalResourceId || context.logStreamName,
			StackId: event.StackId,
			RequestId: event.RequestId,
			LogicalResourceId: event.LogicalResourceId,
			Data: responseData
		});
		let parsedUrl = url.parse(event.ResponseURL);
		let options = {
			hostname: parsedUrl.hostname,
			port: 443,
			path: parsedUrl.path,
			method: "PUT",
			headers: {
				"content-type": "",
				"content-length": responseBody.length
			}
		};

		let request = https.request(options, (data) => {
			res(data.statusCode);
		});
		request.on('error', (err) => {
			console.error(err);
			reject(err);
		});
		request.write(responseBody);
		request.end();
	});
	return response;
};

module.exports = {
	send: Send
};
