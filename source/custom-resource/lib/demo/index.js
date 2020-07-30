/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
const AWS = require('aws-sdk');


/**
 * Copy Console assets and Container assets from source to destination buckets
 */
const copyAssets = async (config) => {

	const s3 = new AWS.S3();
	const {srcBucket,srcPath,manifestFile,destBucket,awsExports} = config;

	try {
		// get file manifest from s3
		let params = {
			Bucket: srcBucket,
			Key: `${srcPath}/${manifestFile}`
		};

		const data = await s3.getObject(params).promise();
		const manifest = JSON.parse(data.Body);
		console.log('Manifest:', JSON.stringify(manifest, null, 2));

		// Loop through manifest and copy files to the destination bucket
		await Promise.all(manifest.map(file => {
			return s3.copyObject({
				Bucket: destBucket,
				CopySource: `${srcBucket}/${srcPath}/console/${file}`,
				Key: file
			}).promise();
		}));

		console.log(`creating config file: ${JSON.stringify(params)}`);
		await s3.putObject({
			Bucket: destBucket,
			Key: 'assets/aws-exports.js',
			Body: awsExports
		}).promise();

	} catch (err) {
		throw err;
	}
	return 'success';
};


const delAssets = async (config) => {

	const s3 = new AWS.S3();

	try {
		let params = {
			Bucket: config.destBucket
		};
		let data = await s3.listObjects(params).promise();
		let objects = [];
		for (let i = 0; i < data.Contents.length; i++) {
			objects.push({
				Key: data.Contents[i].Key
			});
		}
		params = {
			Bucket: config.destBucket,
			Delete: {
				Objects: objects
			}
		};
		await s3.deleteObjects(params).promise();
	} catch (err) {
		throw err;
	}
	return 'success';
}

module.exports = {
	copyAssets: copyAssets,
	delAssets: delAssets
};