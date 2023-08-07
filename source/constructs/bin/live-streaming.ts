#!/usr/bin/env node

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

 import 'source-map-support/register';
 import * as cdk from 'aws-cdk-lib';
 import { LiveStreaming } from '../lib/live-streaming';
 import { AwsSolutionsChecks } from 'cdk-nag';
 import { DefaultStackSynthesizer } from 'aws-cdk-lib';
 
 const app = new cdk.App();
 new LiveStreaming(app, 'LiveStreaming', { // NOSONAR
    synthesizer: new DefaultStackSynthesizer({
      generateBootstrapVersionRule: false
    })
  }); // NOSONAR

 //cdk nag
 cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));