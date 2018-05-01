#!/bin/bash

region="us-east-1"
tmpl="dev.yaml"
name="$1"
email="abc@abc.com"

[ -e dev ] && rm -r dev
mkdir dev
cp -R ../source dev/

# Deploy Source Code
cd dev/source/custom-resources/
npm install --silent --production
zip -q -r9 ../../custom-resources.zip *

cd ../../
rm -R source/

files="$(ls)"
for file in ${files}; do
	aws s3 cp $file s3://solutions-test-$region/live-streaming-on-aws/2.0/ --region $region --acl public-read --profile builder
done

# Deploy CFN Template
cp ../live-streaming-on-aws.yaml ./$tmpl
sed -i '' -e s/CODEBUCKET/solutions-test/g ./$tmpl
sed -i '' -e s/CODEVERSION/2.0/g ./$tmpl

function create {
  aws cloudformation create-stack --stack-name $name --template-body \
  file://$tmpl --capabilities CAPABILITY_IAM --region $region \
	--parameters ParameterKey=AdminEmail,ParameterValue=$email --output text  2>&1> /dev/null
}
function status {
  aws cloudformation describe-stacks --region $region --stack-name $name  \
  --query Stacks[].StackStatus --output text --output text 2>/dev/null
}

error="$(create)" && echo "launching..." || echo "failed :" $error
echo
printf "In progress..."
until [ "$(status)" != "CREATE_IN_PROGRESS" ] ; do
	sleep  3
	printf "."
done
echo "done:"
if [ -z $(status) ]; then
	echo "FAILED"
else
	echo $(status)
fi
