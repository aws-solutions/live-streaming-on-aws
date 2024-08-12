const AWS = require('aws-sdk');

module.exports = {
  readOutputs: async function (solution) {
    const outputs = solution.Outputs;
    for (let index = 0; index < outputs.length; index++) {
      const output = outputs[index];
      if (output.OutputKey === 'MediaLiveChannelId' && output.Description === 'MediaLive Channel Id') {
        solution.channelId = output.OutputValue;
      }
    }
  },
  startChannel: async function (channelId) {
    console.log(`Starting Channel ${channelId}`);
    const medialive = new AWS.MediaLive({
      region: process.env.CURRENT_STACK_REGION
    });
    try {
      const params = {
        ChannelId: channelId
      };
      await medialive.startChannel(params).promise();
    } catch (err) {
      console.error(err);
      throw err;
    }
    return 'success';
  },
  stopChannel: async function (channelId) {
    console.log(`Stopping Channel ${channelId}`);
    const medialive = new AWS.MediaLive({
      region: process.env.CURRENT_STACK_REGION
    });
    try {
      const params = {
        ChannelId: channelId
      };
      await medialive.stopChannel(params).promise();
    } catch (err) {
      console.error(err);
      throw err;
    }
    return 'success';
  },
  channel_state: async function (channelId) {
    const medialive = new AWS.MediaLive({
      region: process.env.CURRENT_STACK_REGION
    });
    console.log(`Trying to fetch channel ${channelId} State`);
    let mlPromise, state;
    try {
      const params = {
        ChannelId: channelId
      };
      mlPromise = medialive.describeChannel(params).promise();
    } catch (err) {
      console.error(err);
      throw err;
    }

    await mlPromise.then(async (data) => {
      state = data.State;
    }).catch(err => {
      console.log('Unable to fetch MediaLive channel details.');
      console.log(err);
    });

    return state;
  },
  channel_wait: async function (channelId, state) {
    const medialive = new AWS.MediaLive({
      region: process.env.CURRENT_STACK_REGION
    });
    console.log(`Waiting for channel state: ${state}`);

    try {
      const params = {
        ChannelId: channelId
      };
      await medialive.waitFor(state, params).promise();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

};
