'use strict';
const AWS = require('aws-sdk');

let response;
let responseData;
let params;

let CreateChannel = function(config) {
  response = new Promise((res, reject) => {
    const mediapackage = new AWS.MediaPackage({
      region: process.env.AWS_REGION
    });
    const ssm = new AWS.SSM({
      region: process.env.AWS_REGION
    });

    params = {
      Id:config.ChannelId,
      Description:'Live Streaming on AWS Solution'
    };

    mediapackage.createChannel(params, function(err, data) {
      if (err) reject(err);
      else {
        responseData = {
          ChannelId:config.ChannelId,
          Url:data.HlsIngest.IngestEndpoints[0].Url,
          Username:data.HlsIngest.IngestEndpoints[0].Username,
          PassParam:data.HlsIngest.IngestEndpoints[0].Password
        };
        console.log('Endpoints:', JSON.stringify(responseData, null, 2));
        params = {
          Name: data.HlsIngest.IngestEndpoints[0].Username,
          Type: 'String',
          Value: data.HlsIngest.IngestEndpoints[0].Password
        };

        ssm.putParameter(params, function(err, data) {
          if (err) reject(err);
          else {
            console.log('Channel created and credentials stored in SSM ParameterStore: ',JSON.stringify(responseData,null,2));
            res(responseData);
          }
        });
      }
    });
  });
  return response;
};

let DeleteChannel = function(config) {
  response = new Promise((res, reject) => {

    const mediapackage = new AWS.MediaPackage({
    	region: 'us-east-1'
    });

    let promises = [];
    let params;

    function delEndpoint(id) {
    	let response = new Promise((res, reject) => {
    		let params = {
    			Id: id
    		};
    		mediapackage.deleteOriginEndpoint(params, function(err,data) {
    			if (err) reject(err);
    			else {
    				res(id+' deleted');
    			}
    		});
    	});
    	return response;
    }

    params = {
      ChannelId:config.ChannelId
    };
    mediapackage.listOriginEndpoints(params, function(err,data) {
    	if (err) console.log(err);
    	else {
    		data.OriginEndpoints.forEach(function(endpoint){
    			promises.push(delEndpoint(endpoint.Id));
    		});
    		Promise.all(promises)
    		.then(() =>{
    			params = {
    				Id: config.ChannelId
    			};
    			mediapackage.deleteChannel(params, function(err,data) {
    				if (err) reject(err);
    				else res('sucess');
    			});
    		});
    	}
    });
  });
  return response;
};

module.exports = {
	createChannel: CreateChannel,
  deleteChannel: DeleteChannel
};
