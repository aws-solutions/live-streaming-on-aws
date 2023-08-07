// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const axios = require('axios');


const send = async (config) => {
    //Remove lambda arn from config to avoid sending AccountId
    delete config['ServiceToken'];
    delete config['Resource'];
    let data;

    try {
        const metrics = {
            Solution: config.SolutionId,
            UUID: config.UUID,
            TimeStamp: new Date().toISOString(),
            Data: config
        };
        const params = {
            method: 'post',
            port: 443,
            url: 'https://metrics.awssolutionsbuilder.com/generic',
            headers: {
                'Content-Type': 'application/json'
            },
            data: metrics
        };
        //Send Metrics & retun status code.
        data = await axios(params);
    } catch (err) {
        console.error(err);
        throw err;
    }
    return data.status;
};


module.exports = {
    send: send
};
