// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '@aws-cdk/assert/jest';
import { Stack } from 'aws-cdk-lib';
import { SynthUtils } from '@aws-cdk/assert';
import * as LiveStreaming from '../lib/live-streaming';

expect.addSnapshotSerializer({
    test: (val) => typeof val === 'string',
    print: (val) => {
        const valueReplacements = [
            {
                regex: /AssetParameters([A-Fa-f0-9]{64})(\w+)/,
                replacementValue: 'AssetParameters[HASH REMOVED]'
            },
            {
                regex: /(\w+ for asset)\s?(version)?\s?"([A-Fa-f0-9]{64})"/,
                replacementValue: '$1 [HASH REMOVED]'
            }
        ];

        return `${valueReplacements.reduce(
            (output, replacement) => output.replace(replacement.regex, replacement.replacementValue),
            val as string
        )}`;
    }
});

test('LiveStreaming Stack Test', () => {
    const stack = new Stack();
    const liveStreamingTest = new LiveStreaming.LiveStreaming(stack, 'LiveStreaming');
    expect(SynthUtils.toCloudFormation(liveStreamingTest)).toMatchSnapshot();
});