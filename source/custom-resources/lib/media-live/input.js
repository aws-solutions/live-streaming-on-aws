'use strict';
const AWS = require('aws-sdk');

function ssmPut(user,pass) {

	const ssm = new AWS.SSM({
	 region:  process.env.AWS_REGION
	});

  let _ssm = {
    Name:user,
    Description:'Live Stream solution input credentials',
    Type:'String',
    Value:pass
  };

	ssm.putParameter(_ssm, function(err, data) {
		if (err) throw(err);
		else console.log(user, ' credentials stored in SSM ParameterStore');
	});
}

let CreatePullInput = function(config) {
	let response = new Promise((res, reject) => {

		const medialive = new AWS.MediaLive({
			region: process.env.AWS_REGION
		});

		let params = {
			Name: config.StreamName,
			Type: config.Type,
			Sources: [
				{
					Url: config.PriUrl
				},
				{
					Url: config.SecUrl
				}
			]
		};

		if (config.PriUser !== null && config.PriUser !== '') {
			params.Sources[0].Username = config.PriUser;
			params.Sources[0].PasswordParam = config.PriUser;
			ssmPut(config.PriUser,config.PriPass);
		}
		if (config.SecUser !== null && config.SecUser !== '') {
			params.Sources[1].Username = config.SecUser;
			params.Sources[1].PasswordParam = config.SecUser;
			ssmPut(config.SecUser,config.SecPass);
		}
		medialive.createInput(params, function(err, data) {
			if (err) reject(err);
			else {
				let responseData = {
					Id: data.Input.Id,
					EndPoint1: 'Push InputType only',
					EndPoint2: 'Push InputType only'
				};
				res(responseData);
			}
		});
	});
	return response;
};

let CreatePushInput = function(config) {
	let response = new Promise((res, reject) => {

		const medialive = new AWS.MediaLive({
			region: process.env.AWS_REGION
		});

		let params = {
			WhitelistRules: [{
				Cidr: config.Cidr
			}]
		};
		medialive.createInputSecurityGroup(params, function(err, data) {
			if (err) reject(err);
			else {
				let params = {
					InputSecurityGroups: [data.SecurityGroup.Id],
					Name: config.StreamName,
					Destinations: [{
						StreamName: config.StreamName
					}],
					Type: config.Type
				};
				medialive.createInput(params, function(err, data) {
					if (err) reject(err);
					else {
						let responseData = {
							Id: data.Input.Id,
							EndPoint1: data.Input.Destinations[0].Url,
							EndPoint2: data.Input.Destinations[1].Url
						};
						res(responseData);
					}
				});
			}
		});
	});
	return response;
};

let DeleteInput = function(PhysicalResourceId) {
	let response = new Promise((res, reject) => {
		const medialive = new AWS.MediaLive({
			region: process.env.AWS_REGION
		});

		let params = {
  		InputId: PhysicalResourceId
		};
		medialive.deleteInput(params, function(err, data) {
			if (err) reject(err);
			else res('success');
		});
	});
	return response;
};

module.exports = {
	createPushInput: CreatePushInput,
	createPullInput: CreatePullInput,
	deleteInput: DeleteInput
};
