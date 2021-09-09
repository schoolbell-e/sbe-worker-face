import REDIS, { Redis } from './Redis';

/**
 * npm run test -- src/shared/servers/Redis.spec.ts
 */
describe('Redis test', () => {
  // const REDIS_KEY = 'foo';
  // const FLOAT_32_ARRAY = new Float32Array([1, 2]);
  // const BUFFER = Buffer.from(FLOAT_32_ARRAY.buffer);
  const redis = new Redis();

  afterAll(()=>{
    redis.client.quit();
    REDIS.client.quit();    
  })

  // it('test return_buffers option', async () => {
  //   const redis = new Redis({ return_buffers: true });
  //   const client = await redis.getClient();
  //   await promisify(client.set).bind(client)(REDIS_KEY, BUFFER as any);

  //   const fetched: any = await promisify(client.get).bind(client)(REDIS_KEY);
  //   assert(BUFFER?.toString('binary') === (<Buffer>fetched).toString('binary'));
  // }, 30000);

  it ('healthcheck()', async ()=>{
    const bool = await redis.healthcheck();
    expect(bool).toBeTruthy();
  })
});