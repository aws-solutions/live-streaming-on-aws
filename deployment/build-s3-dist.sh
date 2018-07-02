#!/bin/bash
# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Please provide the base source bucket name and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions v1.0.0"
    exit 1
fi

[ -e dist ] && rm -r dist
echo "== mkdir -p dist"
mkdir -p dist
echo "== cp live-streaming-on-aws.yaml dist/live-streaming-on-aws.template"
cp live-streaming-on-aws.yaml dist/live-streaming-on-aws.template
sed  -i "" "s/CODEBUCKET/$1/g" dist/live-streaming-on-aws.template
sed  -i "" "s/CODEVERSION/$2/g" dist/live-streaming-on-aws.template
cd ../source/
echo "== generate console-manifest.json"
find console/* -type f | awk ' BEGIN { ORS = ""; print "["; } { print "\/\@"$0"\/\@"; } END { print "]"; }' | sed "s^\"^\\\\\"^g;s^\/\@\/\@^\", \"^g;s^\/\@^\"^g" > ./console-manifest.json
cp ./console-manifest.json ./custom-resource-js/lib/demo/console-manifest.json
mv ./console-manifest.json ./custom-resource-py/console-manifest.json
echo "== copy console/ to /deployment/dist/"
cp -R ./console ../deployment/dist/
cd ./custom-resource-js/
echo "== zip and copy node source code files"
npm install --production
zip -q -r9 ../../deployment/dist/custom-resource-js.zip *
cd ../custom-resource-py/
echo "== zip and copy python source code files"
zip -q -r9 ../../deployment/dist/custom-resource-py.zip *
cd ../../deployment/
echo "== s3 files in dist/:"

ls -lh dist/
