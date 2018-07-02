#!/bin/bash

# This script should be run from the repo's deployment directory
# cd deployment
# ./build-open-source-dist.sh

[ -e open-source ] && rm -r open-source
echo "== mkdir -p open-source/dist/deployment"
mkdir -p open-source/dist/deployment
echo "== cp ./live-streaming-on-aws.yaml ./build-s3-dist.sh open-source/dist/deployment"
cp ./live-streaming-on-aws.yaml ./build-s3-dist.sh open-source/dist/deployment
echo "== cp ../LICENSE.txt ../NOTICE.txt ../README.md open-source/dist/"
cp ../LICENSE.txt ../NOTICE.txt ../README.md open-source/dist/
echo "== cp -r ../source ./open-source/dist/"
cp -r ../source ./open-source/dist/
echo "== rm -rf open-source/dist/source/custom-resource-js/node_modules"
rm -rf open-source/dist/source/custom-resource-js/node_modules
echo "== ./open-source/dist && zip -rq ../live-streaming-on-aws.zip *"
cd ./open-source/dist && zip -rq ../live-streaming-on-aws.zip *
echo "== cd .. && rm -rf dist"
cd .. && rm -rf dist
echo "== open-source files:"
pwd
ls -lh
