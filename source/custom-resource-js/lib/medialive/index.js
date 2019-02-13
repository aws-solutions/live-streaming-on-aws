/**
 * @function MediaLive
 * @description AWS Elemental MediaLive module for Node 8.10+ to create/delete
 * MediaLive Inputs and Channels
*/

const AWS = require('aws-sdk');


// FEATURE/P15424610:: Function updated to use Async & removed ssmPut functions as nolnger required.
let CreatePullInput = async (config) => {
  const medialive = new AWS.MediaLive({
    region: process.env.AWS_REGION
  });
  const ssm = new AWS.SSM({
    region: process.env.AWS_REGION
  });
  let responseData;
  try {
    let params = {
      Name: config.StreamName,
      Type: config.Type,
      Sources: [{
          Url: config.PriUrl
        },
        {
          Url: config.SecUrl
        }
      ]
    };
    //If authentication is required, update params & store U/P in Parameter Store
    if (config.PriUser !== null && config.PriUser !== '') {
      params.Sources[0].Username = config.PriUser;
      params.Sources[0].PasswordParam = config.PriUser;
      let ssm_params = {
        Name: config.PriUser,
        Description: 'Live Stream solution input credentials',
        Type: 'String',
        Value: config.PriPass
      };
      await ssm.putParameter(ssm_params).promise();
    }
    if (config.SecUser !== null && config.SecUser !== '') {
      params.Sources[1].Username = config.SecUser;
      params.Sources[1].PasswordParam = config.SecUser;
      let ssm_params = {
        Name: config.SecUser,
        Description: 'Live Stream solution input credentials',
        Type: 'String',
        Value: config.SecPass
      };
      await ssm.putParameter(ssm_params).promise();
    }
    //Create input
    let data = await medialive.createInput(params).promise();

    responseData = {
      Id: data.Input.Id,
      EndPoint1: 'Push InputType only',
      EndPoint2: 'Push InputType only'
    };
  }
  catch (err) {
    throw err;
  }
  return responseData;
};


//FEATURE/P15424610:: There is a bug with the current version of the SDK that casues
// the Async/Await version of this function to fail.
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
					Type: config.Type
				};

        //Feature/xxxx RTMP Requires Stream names for each input Destination.
        if (config.Type === 'RTMP_PUSH') {
          params.Destinations = [
            {
        		StreamName: config.StreamName+'/primary'
        	  },
        	  {
        		StreamName: config.StreamName+'/secondary'
        	 }
         ];
        }

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


// FEATURE/P15424610:: Function updated to use Async
let CreateChannel = async (config) => {
  const medialive = new AWS.MediaLive({
    region: process.env.AWS_REGION
  });
  const encode1080p = require('./encoding-profiles/medialive-1080p');
  const encode720p = require('./encoding-profiles/medialive-720p');
  const encode540p = require('./encoding-profiles/medialive-540p');
  let responseData;
  try {
    // Define baseline Paameters for cheate channel
    let params = {
      Destinations: [{
        Id: "destination1",
        Settings: [{
            PasswordParam: config.MediaPackagePriUser,
            Url: config.MediaPackagePriUrl,
            Username: config.MediaPackagePriUser
          },
          {
            PasswordParam: config.MediaPackageSecUser,
            Url: config.MediaPackageSecUrl,
            Username: config.MediaPackageSecUser
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

    //hotfix/V52152945 loop only supported in HLS_PULL
    if(config.Type ==='URL_PULL') {
      params.InputAttachments[0].InputSettings = {
         SourceEndBehavior: 'LOOP'
      }
    }
    // Update parameters based on source resolution (defined in cloudformation)
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
        params.EncoderSettings = encode540p;
    }

    //Create Channel & return Channel ID
    let data = await medialive.createChannel(params).promise();

    responseData = {
      ChannelId: data.Channel.Id
    };
  }
  catch (err) {
    throw err;
  }
  return responseData;
};


// FEATURE/P15424610:: Function updated to use Async & support to stop the
// channel before atempting to delte it (required to avoid a stack failure)
let DeleteChannel = async (ChannelId) => {
  const medialive = new AWS.MediaLive({
    region: process.env.AWS_REGION
  });
  //Sleep function to set a time delay between stopping & deleting the channel
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  try {
    let params = {
      ChannelId: ChannelId
    };
    await medialive.stopChannel(params).promise();
    // wait 30 seconds
    await sleep(30000);
    // delete channel
    let data = await medialive.deleteChannel(params).promise();
    // wait 10 seconds
    await sleep(10000);
    // delete input
    params = {
      InputId:data.InputAttachments[0].InputId
    };
    // Describe medialive input
    // If SG delete the SG
    //await medialive delteSecurityGroup (params).promise();
    // then delte the input
    await medialive.deleteInput(params).promise();
    // wait 10 seconds
    await sleep(10000);
    //delete security group if it exists
    data = await medialive.describeInput(params).promise();
    if(data.SecurityGroups.length>0){
          let params={
            InputSecurityGroupId: data.SecurityGroups[0]
        }
        await medialive.deleteInputSecurityGroup(params).promise();
    };

  }
  catch (err) {
    throw err;
  }
  return;
};

module.exports = {
  createPushInput: CreatePushInput,
  createPullInput: CreatePullInput,
  createChannel: CreateChannel,
  deleteChannel: DeleteChannel
};
