'use strict';
const AWS = require('aws-sdk');
const url = require('url');

let CreateHlsEndPoint = function(config) {
	let response = new Promise((res, reject) => {
		const mediapackage = new AWS.MediaPackage({
			region: process.env.AWS_REGION
		});

		let params = {
			ChannelId: config.ChannelId,
			Id: config.ChannelId + '-hls',
			Description: 'Live Streaming on AWS Solution',
			HlsPackage: {
				IncludeIframeOnlyStream: false,
				PlaylistType: 'NONE',
				PlaylistWindowSeconds: 60,
				ProgramDateTimeIntervalSeconds: 0,
				SegmentDurationSeconds: 6,
				UseAudioRenditionGroup: false
			},
			ManifestName: 'index',
			StartoverWindowSeconds: 0,
			TimeDelaySeconds: 0,
		};
		mediapackage.createOriginEndpoint(params, function(err, data) {
			if (err) reject(err);
			else {
				let Url = url.parse(data.Url);
				let responseData = {
  				DomainName: Url.hostname,
  				Path: '/'+Url.pathname.split('/')[3],
  				Manifest:Url.pathname.slice(7)
				};
				console.log('HLS Endpoint created: ', JSON.stringify(responseData, null, 2));
				res(responseData);
			}
		});
	});
	return response;
};

let CreateDashEndPoint = function(config) {
	let response = new Promise((res, reject) => {
		const mediapackage = new AWS.MediaPackage({
			region: process.env.AWS_REGION
		});
		let params = {
			ChannelId: config.ChannelId,
			Id: config.ChannelId + '-dash',
			Description: 'Live Streaming on AWS Solution',
			DashPackage: {
				ManifestWindowSeconds: 60,
				MinBufferTimeSeconds: 30,
				MinUpdatePeriodSeconds: 15,
				Profile: 'NONE',
				SegmentDurationSeconds: 2,
				SuggestedPresentationDelaySeconds: 25
			},
			ManifestName: 'index',
			StartoverWindowSeconds: 0,
			TimeDelaySeconds: 0,
		};
		mediapackage.createOriginEndpoint(params, function(err, data) {
			if (err) reject(err);
			else {
				let Url = url.parse(data.Url);
				let responseData = {
  				DomainName: Url.hostname,
  				Path: '/'+Url.pathname.split('/')[3],
  				Manifest:Url.pathname.slice(7)
				};
				console.log('DASH Endpoint created: ', JSON.stringify(responseData, null, 2));
				res(responseData);
			}
		});
	});
	return response;
};

let CreateMssEndPoint = function(config) {
	let response = new Promise((res, reject) => {
		const mediapackage = new AWS.MediaPackage({
			region: process.env.AWS_REGION
		});
		let params = {
			ChannelId: config.ChannelId,
			Id: config.ChannelId + '-mss',
			Description: 'Live Streaming on AWS Solution',
			MssPackage: {
				ManifestWindowSeconds: 60,
				SegmentDurationSeconds: 2
			},
			ManifestName: 'index',
			StartoverWindowSeconds: 0,
			TimeDelaySeconds: 0,
		};
		mediapackage.createOriginEndpoint(params, function(err, data) {
			if (err) reject(err);
			else {
				let Url = url.parse(data.Url);
				let responseData = {
  				DomainName: Url.hostname,
  				Path: '/'+Url.pathname.split('/')[3],
  				Manifest:Url.pathname.slice(7)
				};
				console.log('MMS Endpoint created: ', JSON.stringify(responseData, null, 2));
				res(responseData);
			}
		});
	});
	return response;
};

module.exports = {
	createHlsEndPoint: CreateHlsEndPoint,
	createDashEndPoint: CreateDashEndPoint,
	createMssEndPoint: CreateMssEndPoint
};
