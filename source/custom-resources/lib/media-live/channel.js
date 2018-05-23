'use strict';
const AWS = require('aws-sdk');

let CreateChannel = function(config) {
	let response = new Promise((res, reject) => {

		const medialive = new AWS.MediaLive({
			region: process.env.AWS_REGION
		});
		const encode1080p = require('./encoding-profiles/1080p');
		const encode720p = require('./encoding-profiles/720p');
		const encode480p = require('./encoding-profiles/480p');

		// Second destination is set to a tmp test deployment until dual input for MediaPackage is rolled out
		let params = {
			Destinations: [{
				Id: "destination1",
				Settings: [{
						PasswordParam: config.MediaPackagePriUser,
						Url: config.MediaPackagePriUrl,
						Username: config.MediaPackagePriPassParam
					},
					{
						PasswordParam: 'b277d5c571864636a46a325465da9813',
						Url: 'https://755ca1af5faa9bea.mediapackage.us-east-1.amazonaws.com/in/v1/775dd08c9b5349599505293f848623c9/channel',
						Username: 'b277d5c571864636a46a325465da9813'
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
				InputId: config.InputId
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
	createChannel: CreateChannel,
	deleteChannel: DeleteChannel
};
