#!/bin/bash

regions="us-east-1"
tmpl="dev2.yaml"

[ -e dev ] && rm -r dev
mkdir dev
cp -R ../source dev/

# Deploy Source Code
cd dev/source/custom-resources/
rm -rf node_modules
npm install --silent --production
zip -q -r9 ../../custom-resources.zip *

cd ../../
rm -R source/

files="$(ls)"
for region in $regions; do

	for file in ${files}; do
		aws s3 cp $file s3://solutions-test-$region/live-streaming-on-aws/2.0/ --region $region --acl public-read --profile builder
	done
done
# Deploy CFN Template
cp ../live-streaming-on-aws.yaml ./$tmpl
sed -i '' -e s/CODEBUCKET/solutions-test/g ./$tmpl
sed -i '' -e s/CODEVERSION/2.0/g ./$tmpl
