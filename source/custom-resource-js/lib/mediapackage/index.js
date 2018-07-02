'use strict';
const AWS = require('aws-sdk');
const url = require('url');


let CreateEndPoint = function(config) {
	let response = new Promise((res, reject) => {
		const mediapackage = new AWS.MediaPackage({
			region: process.env.AWS_REGION
		});
		let packages = {
		  HlsPackage: {
		    IncludeIframeOnlyStream: false,
		    PlaylistType: 'NONE',
		    PlaylistWindowSeconds: 60,
		    ProgramDateTimeIntervalSeconds: 0,
		    SegmentDurationSeconds: 6,
		    UseAudioRenditionGroup: false
		  },
		  DashPackage: {
		    ManifestWindowSeconds: 60,
		    MinBufferTimeSeconds: 30,
		    MinUpdatePeriodSeconds: 15,
		    Profile: 'NONE',
		    SegmentDurationSeconds: 2,
		    SuggestedPresentationDelaySeconds: 25
		  },
		  MssPackage: {
		    ManifestWindowSeconds: 60,
		    SegmentDurationSeconds: 2
		  }
		}
		let params = {
			ChannelId: config.ChannelId,
			Description: 'Live Streaming on AWS Solution',
			ManifestName: 'index',
			StartoverWindowSeconds: 0,
			TimeDelaySeconds: 0,
		};
		switch (config.EndPoint) {
			case 'HLS':
				params.Id = config.ChannelId + '-hls';
				params.HlsPackage = packages.HlsPackage;
				break;
			case 'DASH':
				params.Id = config.ChannelId + '-dash';
				params.DashPackage = packages.DashPackage;
				break;
			case 'MSS':
				params.Id = config.ChannelId + '-mss';
				params.MssPackage = packages.MssPackage;
				break;
			default:
				reject('Error EndPoint not defined')
		}
		mediapackage.createOriginEndpoint(params, function(err, data) {
			if (err) reject(err);
			else {
				let Url = url.parse(data.Url);
				let responseData = {
					Id:data.Id,
  				DomainName: Url.hostname,
  				Path: '/'+Url.pathname.split('/')[3],
  				Manifest:Url.pathname.slice(7)
				};
				console.log(config.EndPoint,' Endpoint created: ', JSON.stringify(responseData, null, 2));
				res(responseData);
			}
		});
	});
	return response;
};


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
            console.log('RESPONSE::\n ',JSON.stringify(responseData,null,2));
            res(responseData);
          }
        });
      }
    });
  });
  return response;
};


let DeleteChannel = function(ChannelId) {
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
      ChannelId:ChannelId
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
    				Id:ChannelId
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
  createEndPoint: CreateEndPoint,
	createChannel: CreateChannel,
  deleteChannel: DeleteChannel
};
