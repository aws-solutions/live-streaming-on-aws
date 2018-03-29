#!/bin/bash
# curently works in the following regions due to the combination of ETS and
# Step Functions
#EU (Ireland)
#Asia Pacific (Tokyo)
#US East (N. Virginia)
#US West (Oregon)
# Asia Pacific (Sydney)

# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Please provide the base source bucket name and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions v1.0.0"
    exit 1
fi

mkdir -p dist

echo "copy cfn template to dist"
cp live-streaming-on-aws.yaml dist/live-streaming-on-aws.template

bucket="s/CODEBUCKET/$1/g"
sed -i -e $bucket dist/live-streaming-on-aws.template

bucket="s/CODEVERSION/$2/g"
sed -i -e $bucket dist/live-streaming-on-aws..template

echo "zip and copy source files to dist/"
find ../source -name "node_modules" -exec rm -rf "{}" \;
cd ../source/custom-resources
npm install --production
zip -q -r9 ../../deployment/dist/custom-resources.zip *
