#!/bin/bash
echo '== install latest boto3: install -r source/requirements.txt -t ../source/custome-resource-py'
pip install -r ../source/requirements.txt -t ../source/custome-resource-py

cd ../source/custom-resource-js/
npm install --silent
npm test
