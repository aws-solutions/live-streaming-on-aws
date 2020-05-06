
#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name trademarked-solution-name version-code
#
# Paramenters:
#  - source-bucket-base-name: Name for the S3 bucket location where the template will source the Lambda
#    code from. The template will append '-[region_name]' to this bucket name.
#    For example: ./build-s3-dist.sh solutions my-solution v1.0.0
#    The template will then expect the source code to be located in the solutions-[region_name] bucket
#
#  - trademarked-solution-name: name of the solution for consistency
#
# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Please provide the base source bucket name, trademark approved solution name and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions trademarked-solution-name v1.0.0"
    exit 1
fi

set -e

# Get reference for all important folders
template_dir="$PWD"
template_dist_dir="$template_dir/global-s3-assets"
build_dist_dir="$template_dir/regional-s3-assets"
source_dir="$template_dir/../source"

echo "------------------------------------------------------------------------------"
echo "Rebuild distribution"
echo "------------------------------------------------------------------------------"
rm -rf $template_dist_dir
mkdir -p $template_dist_dir
rm -rf $build_dist_dir
mkdir -p $build_dist_dir

[ -e $template_dist_dir ] && rm -r $template_dist_dir
[ -e $build_dist_dir ] && rm -r $build_dist_dir
mkdir -p $template_dist_dir $build_dist_dir

echo "------------------------------------------------------------------------------"
echo "Main CloudFormation Template"
echo "------------------------------------------------------------------------------"
cp $template_dir/live-streaming-on-aws.yaml $template_dist_dir/live-streaming-on-aws.template

replace="s/CODE_BUCKET/$1/g"
echo "sed -i -e $replace"
sed -i -e $replace $template_dist_dir/live-streaming-on-aws.template
replace="s/SOLUTION_NAME/$2/g"
echo "sed -i -e $replace"
sed -i -e $replace $template_dist_dir/live-streaming-on-aws.template
replace="s/CODE_VERSION/$3/g"
echo "sed -i -e $replace"
sed -i -e $replace $template_dist_dir/live-streaming-on-aws.template
# remove tmp file for MACs
[ -e $template_dist_dir/live-streaming-on-aws.template-e ] && rm -r $template_dist_dir/live-streaming-on-aws.template-e

echo "------------------------------------------------------------------------------"
echo "Buildinbg console"
echo "------------------------------------------------------------------------------"
cd $source_dir/console
echo "NPM INSTALL::"
npm install 
mkdir ./assets/js/lib
## Bootstrap
cp ./node_modules/bootstrap/dist/js/bootstrap.min.js ./assets/js/lib/bootstrap.min.js
cp ./node_modules/bootstrap/dist/css/bootstrap.min.css ./assets/css/bootstrap.min.css
cp ./node_modules/popper.js/dist/popper.min.js ./assets/js/lib/
## JQuery
mv ./node_modules/jquery/dist/jquery.min.js ./assets/js/lib/
##  VideoJS
mv ./node_modules/video.js/dist/video.js ./assets/js/lib/
mv ./node_modules/video.js/dist/video-js.css ./assets/css/
mv ./node_modules/videojs-contrib-hls/dist/videojs-contrib-hls.js ./assets/js/lib/
echo "CURL"
# No NPM repos avalable for:
curl --location http://orange-opensource.github.io/hasplayer.js/1.10.0/hasplayer.min.js --output $source_dir/console/assets/js/lib/hasplayer.min.js
curl --location https://cdn.dashjs.org/latest/dash.all.min.js --output $source_dir/console/assets/js/lib/dash.all.min.js
curl --location https://github.com/videojs/videojs-contrib-dash/releases/download/v2.11.0/videojs-dash.js --output $source_dir/console/assets/js/lib/videojs-dash.js
echo "Removing node_modules and copying console to regional folder "

rm -rf node_modules/
rm package-lock.json
cd ..
cp -rv ./console $build_dist_dir/

echo "------------------------------------------------------------------------------"
echo "Creating NODE custom-resource deployment package"
echo "------------------------------------------------------------------------------"
cd $source_dir/custom-resource-js/
rm -rf node_modules/
npm install --production
rm package-lock.json
zip -q -r9 $build_dist_dir/custom-resource-js.zip *

cd $source_dir
echo "------------------------------------------------------------------------------"
echo "Creating PYTHON custom-resource deployment package"
echo "------------------------------------------------------------------------------"
cd $source_dir/custom-resource-py/
pip3 install -r ./requirements.txt -t .
zip -q -r9 $build_dist_dir/custom-resource-py.zip *

echo "------------------------------------------------------------------------------"
echo "Build S3 Packaging Complete"
echo "------------------------------------------------------------------------------"
