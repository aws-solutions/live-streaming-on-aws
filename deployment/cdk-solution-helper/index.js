// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Imports
const fs = require('fs');

// Paths
const global_s3_assets = '../global-s3-assets';

//this regular express also takes into account lambda functions defined in nested stacks
const _regex = /[\w]*AssetParameters/g;

// For each template in global_s3_assets ...
fs.readdirSync(global_s3_assets).forEach(file => {
    // Import and parse template file
    const raw_template = fs.readFileSync(`${global_s3_assets}/${file}`);
    let template = JSON.parse(raw_template);

    // Clean-up Lambda function code dependencies
    const resources = (template.Resources) ? template.Resources : {};
    const lambdaFunctions = Object.keys(resources).filter(function (key) {
        return (resources[key].Type === 'AWS::Lambda::Function');
    });

    lambdaFunctions.forEach(function (f) {
        const fn = template.Resources[f];
        let prop;
        if (fn.Properties.hasOwnProperty('Code')) {
            prop = fn.Properties.Code;
        } else if (fn.Properties.hasOwnProperty('Content')) {
            prop = fn.Properties.Content;
        }

        console.debug(`fn: ${JSON.stringify(fn)}`);
        console.debug(`prop: ${JSON.stringify(prop)}`);

        if (prop.hasOwnProperty("S3Bucket")) {
            // Set the S3 key reference
            let artifactHash = Object.assign(prop.S3Key);
            console.debug(`artifactHash is ${artifactHash}`);
            const assetPath = `asset${artifactHash}`;
            prop.S3Key = `%%SOLUTION_NAME%%/%%VERSION%%/${assetPath}`;
     
            // Set the S3 bucket reference
            prop.S3Bucket = {
            "Fn::Sub": "%%BUCKET_NAME%%-${AWS::Region}",
        };
      } else {
        console.warn(`No S3Bucket Property found for ${JSON.stringify(prop)}`);
      }
    });

    // Clean-up Lambda Layer code dependencies
    const lambdaLayers = Object.keys(resources).filter(function (key) {
    return resources[key].Type === "AWS::Lambda::LayerVersion";
    });
    lambdaLayers.forEach(function (l) {
    const layer = template.Resources[l];
    if (layer.Properties.Content.hasOwnProperty('S3Bucket')) {
        let s3Key = Object.assign(layer.Properties.Content.S3Key);
        layer.Properties.Content.S3Key = `%%SOLUTION_NAME%%/%%VERSION%%/${s3Key}`;
        layer.Properties.Content.S3Bucket = {
        'Fn::Sub': '%%BUCKET_NAME%%-${AWS::Region}'
        }
    }
    });

    // Clean-up nested template stack dependencies
    const nestedStacks = Object.keys(resources).filter(function(key) {
        return resources[key].Type === 'AWS::CloudFormation::Stack'
    });

    nestedStacks.forEach(function(f) {
        const fn = template.Resources[f];
        fn.Properties.TemplateURL = {
            'Fn::Join': [
                '',
                [
                    'https://%%TEMPLATE_BUCKET_NAME%%.s3.',
                    {
                        'Ref' : 'AWS::URLSuffix'
                    },
                    '/',
                    `%%SOLUTION_NAME%%/%%VERSION%%/${fn.Metadata.nestedStackFileName}`
                ]
            ]
        };

        const params = fn.Properties.Parameters ? fn.Properties.Parameters : {};
        const nestedStackParameters = Object.keys(params).filter(function(key) {
            if (key.search(_regex) > -1) {
                return true;
            }
            return false;
        });

        nestedStackParameters.forEach(function(stkParam) {
            fn.Properties.Parameters[stkParam] = undefined;
        });
    });

    // Clean-up parameters section
    const parameters = (template.Parameters) ? template.Parameters : {};
    const assetParameters = Object.keys(parameters).filter(function (key) {
        if (key.search(_regex) > -1) {
            return true;
        }
        return false;
    });
    assetParameters.forEach(function (a) {
        template.Parameters[a] = undefined;
    });

    // Output modified template file
    const output_template = JSON.stringify(template, null, 2);
    fs.writeFileSync(`${global_s3_assets}/${file}`, output_template);
});