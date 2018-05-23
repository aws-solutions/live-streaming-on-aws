'use strict';
const https = require('https');
const moment = require('moment');

let SendMetrics = function(event) {
  let response = new Promise((res, reject) => {
    let data;
    if (event.RequestType === 'Create') {
      data = {
        Version: event.ResourceProperties.Version,
        Launched: moment().utc().format(),
        InputType: event.ResourceProperties.InputType,
        InputCodec: event.ResourceProperties.InputCodec,
        InputRes: event.ResourceProperties.InputRes,
      };
      // reporting on params without passing any userdata.
      if (event.ResourceProperties.PriPullURL != '') data.PriPullURL = true;
      if (event.ResourceProperties.PriPullUser != '') data.PriPullUser = true;
      if (event.ResourceProperties.PriPullPass != '') data.PriPullPass = true;
      if (event.ResourceProperties.SecPullURL != '') data.SecPullURL = true;
      if (event.ResourceProperties.SecPullUser != '') data.SecPullUser = true;
      if (event.ResourceProperties.SecPullPass != '') data.SecPullPass = true;
    } else {
      data = {
        Version: event.ResourceProperties.Version,
        Deleted: moment().utc().format()
      };
    }

    let metric = {
      Solution: event.ResourceProperties.SolutionId,
      UUID: event.ResourceProperties.UUID,
      TimeStamp: moment().utc().format('YYYY-MM-DD HH:mm:ss.S'),
      Data: data
    };

    let _options = {
      hostname: 'metrics.awssolutionsbuilder.com',
      port: 443,
      path: '/generic',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    let request = https.request(_options, function(response) {
      // data is streamed in chunks from the server
      // so we have to handle the "data" event
      let buffer;
      let data;
      response.on('data', function(chunk) {
        buffer += chunk;
      });
      request.on('error', (err) => console.error(err));
      response.on('end', function() {
        data = buffer;
        res(data);
      });
    });
    request.write(JSON.stringify(metric));
    request.end();
  });
  return response;
};

module.exports = {
  sendMetrics: SendMetrics
};
