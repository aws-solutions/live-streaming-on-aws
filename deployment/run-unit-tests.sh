#!/bin/bash

set -e

cd ../source/custom-resource/
npm ci --silent
npm test

cd ../constructs/
npm ci --silent
npm test -- -u