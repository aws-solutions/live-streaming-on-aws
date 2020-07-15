#!/bin/bash

cd ../source/custom-resource/
npm ci --silent
npm test

# remove unwanted modules folder so not included in build s3 and open source steps.
rm -rf node_modules/

