#!/bin/bash

# This script should be run from the repo's deployment directory
# cd deployment
# ./build-open-source-dist.sh

mkdir -p open-source/dist/deployment

cp build-s3-dist.sh open-source/dist/deployment/
cp live-streaming-on-aws.yaml open-source/dist/deployment/
cp -r ../LICENSE.txt ../NOTICE.txt ../README.md ../source open-source/dist/
find open-source/dist/source -name "node_modules" -exec rm -r "{}" \;
cd open-source/dist
zip -rq ../live-streaming-on-aws.zip *
cd ..
rm -rf dist
