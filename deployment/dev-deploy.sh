#!/bin/bash
#regions="us-east-1 us-west-2 eu-west-1 eu-central-1"
regions="us-east-1"
bucket="livestream"
profile="default"
version="test-f1"

[ -e dist ] && rm -r dist
echo "== mkdir -p dist"
mkdir -p dist
echo "== cp live-streaming-on-aws.yaml dist/live-streaming-on-aws.template"
cp live-streaming-on-aws.yaml dist/live-streaming-on-aws.yaml
sed  -i "" "s/CODEBUCKET/$bucket/g" dist/live-streaming-on-aws.yaml
#sed  -i "" "s/CODEVERSION/2.1/g" dist/live-streaming-on-aws.yaml
sed  -i "" "s/CODEVERSION/$version/g" dist/live-streaming-on-aws.yaml
cd ../source/
echo "== generate console-manifest.json"
find console/* -type f | awk ' BEGIN { ORS = ""; print "["; } { print "\/\@"$0"\/\@"; } END { print "]"; }' | sed "s^\"^\\\\\"^g;s^\/\@\/\@^\", \"^g;s^\/\@^\"^g" > ./console-manifest.json
cp ./console-manifest.json ./custom-resource-js/lib/demo/console-manifest.json
mv ./console-manifest.json ./custom-resource-py/console-manifest.json
echo "== copy console/ to /deployment/dist/"
cp -R ./console ../deployment/dist/
cd ./custom-resource-js/
rm -rf node_modules/
echo "== zip and copy node source code files"
npm install --production
zip -q -r9 ../../deployment/dist/custom-resource-js.zip *
cd ../custom-resource-py/
#feature/P20903447: install the latest boto3 to support mediaconnect
echo '== generate a setup.cfg file needed for installing boto3'
printf '[install]\nprefix=\n' > setup.cfg
mkdir -p latestboto3
echo '== install latest boto3'
pip install -r ../requirements.txt -t ./latestboto3/
echo '== remove setup.cfg file'
rm setup.cfg
echo '== copy custom-resource-py/ to /deployment/dist/'
cp -R ../custom-resource-py ../../deployment/dist/
echo '== remove latestboto3 folder'
rm -rf ./latestboto3/
cd ../../deployment/dist/custom-resource-py/
echo '== move contents from deployment/dist/custom-resource-py/latestboto3/ to one level up /deployment/dist/custom-resource-py/'
mv -v ./latestboto3/*  .
echo '== remove latestboto3 folder'
rm -rf ./latestboto3/
echo "== zip python source code files"
zip -q -r9 ../custom-resource-py.zip *
#zip -q -r9 ../../deployment/dist/custom-resource-py.zip *
cd ../../../deployment/
echo "== remove custom-resource-py folder"
rm -rf dist/custom-resource-py/
echo "== s3 files in dist/:"
ls -lh dist/
cd dist/

echo "sync files to solutions buckets"
for region in $regions; do
	#aws s3 sync . s3://$bucket-$region/live-streaming-on-aws/2.1/ --region $region --acl public-read --delete --profile $profile
	aws s3 sync . s3://$bucket-$region/live-streaming-on-aws/$version/ --region $region --acl public-read --delete --profile $profile
done
