/**
 * @function MediaLive
 * @description AWS Elemental MediaLive module for Node 8.10+ to create/delete
 * MediaLive Inputs and Channels
 */

const AWS = require('aws-sdk');

//FEATURE/V88459989 Mediaconnect added as an input
let CreateInput = async (config) => {
    const medialive = new AWS.MediaLive({
        region: process.env.AWS_REGION
    });
    const ssm = new AWS.SSM({
        region: process.env.AWS_REGION
    });

    let responseData;

    try {

        switch (config.Type) {

            case 'RTP_PUSH':
                //requires Security group

                break;

            case 'RTMP_PUSH':
                //Requires SG and 2 destinations
                break;

            case 'RTMP_PULL':
            case 'URL_PULL':
                //Requires 2 source URLs, authentication is optional.
                break;

            case 'MEDIACONNECT':
                //Requires 2 Mediaconnect Arns
                break;

            default:
                return Promise.reject("srcVideo not defined in request");
        }

        data = await medialive.createInput(params).promise();
    } catch (err) {
        throw err;
    }
    return responseData;
};



module.exports = {
    createPushInput: CreateInput
};
