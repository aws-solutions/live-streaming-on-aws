#!/bin/bash
regions="us-east-1 us-west-2 eu-west-1 eu-central-1"
bucket="solutions-test"
profile="builder"

[ -e dist ] && rm -r dist
mkdir dist
cp -R ../source/* dist

cd dist

echo "Demo console manifest file:"
find . -name '.DS_Store' -type f -delete

find console/* -type f | awk ' BEGIN { ORS = ""; print "["; } { print "\/\@"$0"\/\@"; } END { print "]"; }' | sed "s^\"^\\\\\"^g;s^\/\@\/\@^\", \"^g;s^\/\@^\"^g" > ./custom-resources/lib/demo/manifest.json

cat ./custom-resources/lib/demo/manifest.json

echo "npm install && zip custom resource"
cd custom-resources/
rm -rf node_modules
npm install --silent --production
zip -q -r9 ../custom-resources.zip *
cd ../
rm -R custom-resources/

echo "sync files to solutions buckets"
for region in $regions; do
	aws s3 sync . s3://$bucket-$region/live-streaming-on-aws/2.0/ --region $region --acl public-read --delete --profile $profile
done

echo "Prep test cfn template"
cp ../live-streaming-on-aws.yaml ./live-test.yaml
sed -i '' -e s/CODEBUCKET/$bucket/g ./live-test.yaml
sed -i '' -e s/CODEVERSION/2.0/g ./live-test.yaml
sed -i '' -e s/SENDMETRICS/No/g ./live-test.yaml

echo "copy template to solutions buckets"
for region in $regions; do
	aws s3 cp live-test.yaml s3://$bucket-$region/live-streaming-on-aws/2.0/ --region $region --acl public-read --profile $profile
done
