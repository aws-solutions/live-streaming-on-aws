'use strict';
const AWS = require('aws-sdk');

let CopyFile = function(config, key) {
	return new Promise(function(res, reject) {
		const s3 = new AWS.S3();
		let params = {
			Bucket: config.DemoBucket,
			CopySource: '/' + config.SrcBucket + '/' + config.SrcPath + '/' + key,
			Key: key
		};
		s3.copyObject(params, function(err) {
			if (err) reject(err);
			else {
				console.log('file copy success:', key);
				res('success');
			}
		});
	});
};

let S3Deploy = function(config) {
	const s3 = new AWS.S3();
	let manifest = require('./manifest.json');

	let response = new Promise((res, reject) => {
		let promises = [];
		for (let i = 0; i < manifest.length; i++) {
			promises.push(CopyFile(config, manifest[i]));
		}
		Promise.all(promises)
			.then(() => {
				let params = {
					Body: config.Exports,
					Bucket: config.DemoBucket,
					Key: 'console/assets/js/exports.js',
				};
				s3.putObject(params, function(err) {
					if (err) reject(err);
					else {
						console.log('file copy success:', params.Key);
						res('sucess');
					}
				});
			})
			.catch(err => {
				console.log(err);
				reject(err);
			});
	});
	return response;
};

let S3Delete = function(config) {
	const s3 = new AWS.S3();
	let manifest = require('./manifest.json');
	let objects = [];

	let response = new Promise((res, reject) => {
		for (let i = 0; i < manifest.length; i++) {
			objects.push({
				Key: manifest[i]
			});
		}
		objects.push({
			Key: 'console/assets/js/exports.js'
		});

		let params = {
			Bucket: config.DemoBucket,
			Delete: {
				Objects: objects
			}
		};
		s3.deleteObjects(params, function(err) {
			if (err) reject(err);
			else {
				console.log('Demo files deleted from ', config.DemoBucket);
				let params = {
					Bucket: config.DemoBucket
				};
				s3.deleteBucket(params, function(err) {
					if (err) reject(err);
					else {
						console.log(config.DemoBucket,' Bucket deleted');
						res('sucess');
					}
				});
			}
		});
	});
	return response;
};

module.exports = {
	s3Deploy: S3Deploy,
	s3Delete: S3Delete
};
