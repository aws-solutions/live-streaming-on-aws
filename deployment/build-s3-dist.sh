#!/bin/bash
# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Please provide the base source bucket name and version (subfolder) where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions v1.0.0"
    exit 1
fi

[ -e dist ] && rm -r dist
echo "== mkdir -p dist"
mkdir -p dist
echo "==cp live-streaming-on-aws.yaml dist/live-streaming-on-aws.template"
cp live-streaming-on-aws.yaml dist/live-streaming-on-aws.template
echo "==update CODEBUCKET in template with $1"
replace="s/CODEBUCKET/$1/g"
sed -i -e $replace dist/live-streaming-on-aws.template
echo "==update CODEVERSION in template with $2"
replace="s/CODEVERSION/$2/g"
sed -i -e $replace dist/live-streaming-on-aws.template
echo "== cp -R ../source/console ../source/custom-resource-js ../source/custom-resource-py dist/"
cp -R ../source/console ../source/custom-resource-js ../source/custom-resource-py dist/
echo "cd ./dist/custom-resource-js/ && npm install --production"
cd ./dist/custom-resource-js/ && npm install --production
echo "== zip -q -r9 ../custom-resource-js.zip *"
zip -q -r9 ../custom-resource-js.zip *
echo "== cd ../custom-resource-py/ && pip install -r ./requirements.txt -t ."
cd ../custom-resource-py/ && pip install -r ./requirements.txt -t .
echo "== zip -q -r9 ../custom-resource-py.zip *"
zip -q -r9 ../custom-resource-py.zip *
echo "== cd ../"
cd ../
echo "== rm -rf custom-resource-js custom-resource-py"
rm -rf custom-resource-js custom-resource-py
echo "== s3 files in dist/:"
ls -lh .
