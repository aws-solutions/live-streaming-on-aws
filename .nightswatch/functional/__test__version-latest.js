const { TIMEOUT_5_MIN, TIMEOUT_10_MIN } = require('automation/utils/constants');
const CFN = require('automation/aws/cloudformation');
const profile = require("automation/aws/aws_profiles");
const liveStreamingSolution = require('./live_streaming.js');
let solution;

// for testing locally
// process.env.CURRENT_STACK_NAME = 'LiveStreamingTest'
// process.env.CURRENT_STACK_REGION = 'us-west-2'

describe('Functional Tests', () => {
  beforeAll(async () => {
    const roleARN = `arn:aws:iam::${process.env.TEST_ACCOUNT_IDS}:role/NightsWatchTestPipelinesIamRole`;
    await profile.setDefaultAccountCredentials(roleARN);
  });
  beforeEach(async () => {
    console.log(`Started Execution of ::${expect.getState().currentTestName}`);
  }, TIMEOUT_5_MIN);
  afterEach(async () => {
    console.log(`Finished Execution of ::${expect.getState().currentTestName}`);
  }, TIMEOUT_5_MIN);

  test('Get Stack Input/Output Values', async () => {
    solution = {
      StackName: process.env.CURRENT_STACK_NAME,
      Region: process.env.CURRENT_STACK_REGION
    };
    solution = await CFN.getStackId(solution.StackName, solution.Region);
    await liveStreamingSolution.readOutputs(solution);
  }, TIMEOUT_5_MIN);

  test('TC#1 Start MediaLive Channel', async () => {
    const start = await liveStreamingSolution.startChannel(solution.channelId);
    expect(start).toBe('success');

    // wait for channel to start running
    await liveStreamingSolution.channel_wait(solution.channelId, 'channelRunning');

    // check channel status
    const state = await liveStreamingSolution.channel_state(solution.channelId);
    console.log(`Channel State: ${state}`);
    expect(state).toBe('RUNNING');
  }, TIMEOUT_10_MIN);

  test('TC#2 Stop MediaLive Channel', async () => {
    const stop = await liveStreamingSolution.stopChannel(solution.channelId);
    expect(stop).toBe('success');

    // wait for channel to be stopped
    await liveStreamingSolution.channel_wait(solution.channelId, 'channelStopped');

    // check channel status
    const state = await liveStreamingSolution.channel_state(solution.channelId);
    console.log(`Channel State: ${state}`);
    expect(state).toBe('IDLE');
  }, TIMEOUT_10_MIN);
});
