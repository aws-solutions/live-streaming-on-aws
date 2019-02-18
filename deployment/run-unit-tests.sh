#!/bin/bash
echo 'pip install -r ../source/requirements.txt -t ../source/'
pip install -r ../source/requirements.txt -t ../source/custom-resource-py/

cd ../source/custom-resource-js/
npm install --silent
npm test
