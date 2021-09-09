if (!process.env['PUBSUB_EMULATOR_HOST'])
  process.env['PUBSUB_EMULATOR_HOST'] = 'localhost:8085';
process.env['PUBSUB_PROJECT_ID'] = 'schoolbelle-ci';

import { Worker } from './Worker';
import { Redis } from '@schoolbell-e/backend.servers';
import { promisify } from 'util';
import { PubSub } from '@schoolbell-e/backend.gcp';
import { FailJob } from './FailJob';
import sinon from 'sinon';
import sleep from 'sleep-promise';

/**
 * term signal test
 */

/**
 * npm run test -- src/shared/worker/Worker.spec.ts
 */
describe('Worker test', () => {
  const TOPIC_NAME = 'crawl-and-post';
  const SUBSCRIPTION_NAME = 'crawl-and-post';

  beforeAll(async () => {
    while (true) {
      const message = await PubSub.pull(TOPIC_NAME, SUBSCRIPTION_NAME, {
        timeout: 1,
      });
      if (!message) break;
      message.ack();
    }
  });

  beforeEach(async () => {
    const redis = await new Redis().getClient();
    await promisify(redis.flushall.bind(redis))();
  });

  it('run()', async () => {
    const worker = new Worker(TOPIC_NAME, SUBSCRIPTION_NAME, {});
    worker.MAX_LOOP_CNT = 2;
    worker.PULL_TIMEOUT = 3;
    await worker.run();
    expect(worker.loop_cnt).toBe(2);
  }, 10000);

  // jest process mocking needed
  // it('SIGTERM graceful termination test', async () => {
  //   const worker = new Worker(TOPIC_NAME, SUBSCRIPTION_NAME, {});
  //   worker.MAX_LOOP_CNT = 2;
  //   worker.PULL_TIMEOUT = 3;
  //   const promise = worker.run();
  //   process.kill(process.pid, 'SIGTERM');
  //   await promise;
  //   expect(worker.loop_cnt).toBe(1);
  // }, 10000);

  it('Worker logger test', async () => {
    const worker = new Worker(TOPIC_NAME, SUBSCRIPTION_NAME, {}, 1);
    worker.MAX_LOOP_CNT = 2;
    worker.PULL_TIMEOUT = 3;
    await worker.run();

    const redis = await new Redis().getClient();
    var list = await promisify(redis.lrange.bind(redis))(`WORKER`, 0, -1) as string [];
    expect(list.length > 0).toBeTruthy();
    var list = await promisify(redis.lrange.bind(redis))(
      `WORKER:${TOPIC_NAME}`,
      0,
      -1,
    ) as string [];
    expect(list.length > 0).toBeTruthy();

    var list = await promisify(redis.lrange.bind(redis))(
      `WORKER:${TOPIC_NAME}:${worker.id}`,
      0,
      -1,
    ) as string [];
    expect(list.length > 0).toBeTruthy();

    await sleep(1000);

    var list = await promisify(redis.lrange.bind(redis))(
      `WORKER:${TOPIC_NAME}:${worker.id}`,
      0,
      -1,
    ) as string [];
    expect(list.length === 0).toBeTruthy();
  }, 10000);

  it('PushTofailureBin test', async () => {
    const redis = await new Redis().getClient();
    var list = await promisify(redis.lrange.bind(redis))(`FAILURE`, 0, -1) as string [];
    expect(list.length).toBe(0);

    const worker = new Worker(TOPIC_NAME, SUBSCRIPTION_NAME, {});
    const message = { data: 'hi!' } as any;
    await worker.pushToFailureBucket(message);

    var list = await promisify(redis.lrange.bind(redis))(`FAILURE`, 0, -1) as string [];
    expect(list.length > 0).toBeTruthy();
  });

  it('validateRetryCount test', async () => {
    const worker = new Worker(TOPIC_NAME, SUBSCRIPTION_NAME, {});
    const message = { id: '999' } as any;
    var [valid, retry_cnt] = await worker.validateRetryCount(message);
    expect(valid).toBe(true);
    expect(retry_cnt).toBe(0);
    var [valid, retry_cnt] = await worker.validateRetryCount(message);
    expect(valid).toBe(true);
    expect(retry_cnt).toBe(1);
    var [valid, retry_cnt] = await worker.validateRetryCount(message);
    expect(valid).toBe(true);
    expect(retry_cnt).toBe(2);
    var [valid, retry_cnt] = await worker.validateRetryCount(message);
    expect(valid).toBe(true);
    expect(retry_cnt).toBe(3);
    var [valid, retry_cnt] = await worker.validateRetryCount(message);
    expect(valid).toBe(true);
    expect(retry_cnt).toBe(4);
    var [valid, retry_cnt] = await worker.validateRetryCount(message);
    expect(valid).toBe(true);
    expect(retry_cnt).toBe(5);

    const sandbox = sinon.createSandbox();
    const stub = sandbox.stub(worker, 'pushToFailureBucket');
    sinon.assert.notCalled(stub);
    var [valid, retry_cnt] = await worker.validateRetryCount(message);
    expect(valid).toBe(false);
    expect(retry_cnt).toBe(6);
    sinon.assert.calledOnce(stub);
  });

  it('max retry failure test', async () => {
    let message_id = '';
    const ob = await PubSub.publish(TOPIC_NAME, 'Hi!', { job: 'FailJob' });
    if (ob.message_id) message_id = ob.message_id;
    expect(message_id).toBeTruthy();

    const worker = new Worker(TOPIC_NAME, SUBSCRIPTION_NAME, { FailJob });

    var [valid, retry_cnt] = await worker.validateRetryCount({
      id: message_id,
    } as any);
    var [valid, retry_cnt] = await worker.validateRetryCount({
      id: message_id,
    } as any);
    var [valid, retry_cnt] = await worker.validateRetryCount({
      id: message_id,
    } as any);
    var [valid, retry_cnt] = await worker.validateRetryCount({
      id: message_id,
    } as any);
    var [valid, retry_cnt] = await worker.validateRetryCount({
      id: message_id,
    } as any);
    expect(valid).toBe(true);
    expect(retry_cnt).toBe(4);

    worker.MAX_LOOP_CNT = 1;
    worker.PULL_TIMEOUT = 3;

    const sandbox = sinon.createSandbox();
    const stub = sandbox.stub(worker, 'pushToFailureBucket');

    await worker.run({ should_neck: true, should_race_message: false });
    sinon.assert.notCalled(stub);

    // flush race data
    // const redis = await new Redis().getClient();
    // await promisify(redis.flushall.bind(redis))();
    // flush race data

    worker.loop_cnt = 0;
    await worker.run({ should_neck: true, should_race_message: false });
    sinon.assert.calledOnce(stub);
  });
});
