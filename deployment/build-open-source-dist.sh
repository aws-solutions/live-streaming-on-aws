#!/bin/bash

# This script should be run from the repo's deployment directory
# cd deployment
# ./build-open-source-dist.sh

echo "mkdir -p open-source/dist/deployment"
mkdir -p open-source/dist/deployment
echo "copy cfn template, build-s3-dist.sh & source to open-source/dist"
cp build-s3-dist.sh open-source/dist/deployment/
cp live-streaming-on-aws.yaml open-source/dist/deployment/
cp -r ../LICENSE.txt ../NOTICE.txt ../README.md ../source open-source/dist/
cd open-source/dist
echo "zip -rq ../live-streaming-on-aws.zip *"
zip -rq ../live-streaming-on-aws.zip *
cd ..
echo "open-source files::"
pwd
ls
rm -rf dist
