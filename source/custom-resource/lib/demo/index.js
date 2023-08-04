// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { S3 } = require('@aws-sdk/client-s3');

/**
 * Copy Console assets and Container assets from source to destination buckets
 */
const copyAssets = async (config) => {

	const s3 = new S3({
		customUserAgent: process.env.SOLUTION_IDENTIFIER
	});
	const {srcBucket,srcPath,manifestFile,destBucket,awsExports} = config;

	try {
		// get file manifest from s3
		let params = {
			Bucket: srcBucket,
			Key: `${srcPath}/${manifestFile}`
		};

		const data = await s3.getObject(params);
		const dataBody = await data.Body.transformToString();
		const manifest = JSON.parse(dataBody);
		console.log('Manifest:', JSON.stringify(manifest, null, 2));

		// Loop through manifest and copy files to the destination bucket
		await Promise.all(manifest.map(file => {
			return s3.copyObject({
				Bucket: destBucket,
				CopySource: `${srcBucket}/${srcPath}/console/${file}`,
				Key: file
			});
		}));

		console.log(`creating config file: ${JSON.stringify(params)}`);
		await s3.putObject({
			Bucket: destBucket,
			Key: 'assets/aws-exports.js',
			Body: awsExports
		});

	} catch (err) {
		console.error(err);
		throw err;
	}
	return 'success';
};


const delAssets = async (config) => {

	const s3 = new S3({
        customUserAgent: process.env.SOLUTION_IDENTIFIER
    });

	try {
		let params = {
			Bucket: config.destBucket
		};
		let data = await s3.listObjects(params);
		let objects = [];
		for (let content of data.Contents) {
			objects.push({
				Key: content.Key
			});
		}
		params = {
			Bucket: config.destBucket,
			Delete: {
				Objects: objects
			}
		};
		await s3.deleteObjects(params);
	} catch (err) {
		console.error(err);
		throw err;
	}
	return 'success';
}

module.exports = {
	copyAssets: copyAssets,
	delAssets: delAssets
};