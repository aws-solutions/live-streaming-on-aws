'use strict';
const AWS = require('aws-sdk');

let CreateChannel = function(config) {
  let response = new Promise((res, reject) => {
    const mediapackage = new AWS.MediaPackage({
      region: process.env.AWS_REGION
    });
    const ssm = new AWS.SSM({
      region: process.env.AWS_REGION
    });

    let params = {
      Id:config.ChannelId,
      Description:'Live Streaming on AWS Solution'
    };

    mediapackage.createChannel(params, function(err, data) {
      if (err) reject(err);
      else {
        let responseData = {
          ChannelId:config.ChannelId,
          Url:data.HlsIngest.IngestEndpoints[0].Url,
          User:data.HlsIngest.IngestEndpoints[0].Username,
          PassParam:data.HlsIngest.IngestEndpoints[0].Username
        };
        console.log('Endpoints:', JSON.stringify(responseData, null, 2));
        let params = {
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
  let response = new Promise((res, reject) => {

    const mediapackage = new AWS.MediaPackage({
    	region: process.env.AWS_REGION
    });

    let promises = [];

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

    let params = {
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
    			let params = {
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
