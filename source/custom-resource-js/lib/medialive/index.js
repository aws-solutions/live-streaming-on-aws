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
};

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

		if (config.Type === 'DEMO') params.Type = 'URL_PULL';

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


let CreateChannel = function(config) {
	let response = new Promise((res, reject) => {

		const medialive = new AWS.MediaLive({
			region: process.env.AWS_REGION
		});
		const encode1080p = require('./encoding-profiles/medialive-1080p');
		const encode720p = require('./encoding-profiles/medialive-720p');
		const encode480p = require('./encoding-profiles/medialive-480p');

		// Second destination is set to a tmp test deployment until dual input for MediaPackage is rolled out
		let params = {
			Destinations: [{
				Id: "destination1",
				Settings: [{
						PasswordParam: config.MediaPackagePriUser,
						Url: config.MediaPackagePriUrl,
						Username: config.MediaPackagePriUser
					},
					{
						PasswordParam: config.MediaPackageSeciUser,
						Url: config.MediaPackageSecUrl,
						Username: config.MediaPackageSeciUser
					}
				]
			}],
			InputSpecification: {
				Codec: config.Codec,
				Resolution: '',
				MaximumBitrate: ''
			},
			Name: config.Name,
			RoleArn: config.Role,
			InputAttachments: [{
				InputId: config.InputId,
				InputSettings: {}
			}],
			EncoderSettings: {}
		};

		switch (config.Resolution) {
			case '1080':
				params.InputSpecification.Resolution = 'HD';
				params.InputSpecification.MaximumBitrate = 'MAX_20_MBPS';
				params.EncoderSettings = encode1080p;
				break;
			case '720':
				params.InputSpecification.Resolution = 'HD';
				params.InputSpecification.MaximumBitrate = 'MAX_10_MBPS';
				params.EncoderSettings = encode720p;
				break;
			default:
				params.InputSpecification.Resolution = 'SD';
				params.InputSpecification.MaximumBitrate = 'MAX_10_MBPS';
				params.EncoderSettings = encode480p;
		}

		if (config.Type === 'DEMO') params.InputAttachments[0].InputSettings = {SourceEndBehavior:'LOOP'};

		medialive.createChannel(params, function(err, data) {
			if (err) reject(err);
			else {
				let responseData = {
					ChannelId: data.Channel.Id
				};
				res(responseData);
			}
		});
	});
	return response;
};

let DeleteChannel = function(PhysicalResourceId) {
	let response = new Promise((res, reject) => {
		const medialive = new AWS.MediaLive({
			region: process.env.AWS_REGION
		});
		let params = {
			ChannelId: PhysicalResourceId
		};
		medialive.deleteChannel(params, function(err, data) {
			if (err) reject(err);
			else res('success');
		});
	});
	return response;
};

module.exports = {
	createPushInput: CreatePushInput,
	createPullInput: CreatePullInput,
	createChannel: CreateChannel,
	deleteChannel: DeleteChannel
};
