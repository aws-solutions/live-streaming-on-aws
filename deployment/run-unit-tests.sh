#!/bin/bash

cd ../source/custom-resource-js/
npm install --silent
npm test

# remove unwanted modules folder so not included in build s3 and open source steps.
rm -rf node_lodules/
rm package-lock.json
