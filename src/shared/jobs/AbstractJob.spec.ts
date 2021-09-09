import sleep from 'sleep-promise';
import { promisify } from 'util';
import { Redis } from '@schoolbell-e/backend.servers';
import { AbstractJob } from './AbstractJob';

/**
 * npm run test -- \"src/shared/jobs/AbstractJob.spec.ts
 */
describe('AbstractJob test', () => {
  beforeEach(async () => {
    const redis = await new Redis().getClient();
    await promisify(redis.flushall.bind(redis))();
  });
  afterAll(async () => {
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    const redis = await new Redis().getClient();
    await promisify(redis.flushall.bind(redis))();
  });

  it('logger test', async () => {
    const message_id = '1234';
    const job = new AbstractJob('worker_id', message_id, 5, 1);
    job.perform({ test: true });
    const redis = await new Redis().getClient();
    await sleep(100);
    var list = await promisify(redis.lrange.bind(redis))(`JOB`, 0, -1) as string [];
    expect(list.length).toBe(2);
    var list = await promisify(redis.lrange.bind(redis))(
      `JOB:AbstractJob`,
      0,
      -1,
    ) as string [];
    expect(list.length).toBe(2);
    var list = await promisify(redis.lrange.bind(redis))(
      `JOB:AbstractJob:${message_id}`,
      0,
      -1,
    ) as string [];
    expect(list.length).toBe(2);


    await sleep(1000);

    var list = await promisify(redis.lrange.bind(redis))(`JOB`, 0, -1) as string [];
    expect(list.length).toBe(2);

    var list = await promisify(redis.lrange.bind(redis))(
      `JOB:AbstractJob`,
      0,
      -1,
    ) as string [];
    expect(list.length).toBe(2);
    var list = await promisify(redis.lrange.bind(redis))(
      `JOB:AbstractJob:${message_id}`,
      0,
      -1,
    ) as string [];
    expect(list.length).toBe(0);
  });
});

/**
 * 1. worker logger test
 */

// worker logger test

// $list = self::$container->redis->lrange('WORKER', 0, -1);
// $this->assertTrue(count($list) > 0);
// $list = self::$container->redis->lrange('WORKER:topic', 0, -1);
// $this->assertTrue(count($list) > 0);

// $list = self::$container->redis->lrange('JOB', 0, -1);
// $this->assertSame(count($list), 9);
// $list = self::$container->redis->lrange('JOB:TestJob', 0, -1);
// $this->assertSame(count($list), 9);

// $list = self::$container->redis->lrange('JOB:TestJob:task'.$result1['messageIds'][0], 0, -1);
// $this->assertSame(count($list), 3);
// $list = self::$container->redis->lrange('JOB:TestJob:task'.$result2['messageIds'][0], 0, -1);
// $this->assertSame(count($list), 3);
// $list = self::$container->redis->lrange('JOB:TestJob:task'.$result3['messageIds'][0], 0, -1);
// $this->assertSame(count($list), 3);
