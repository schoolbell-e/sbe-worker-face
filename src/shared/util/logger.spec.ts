import sleep from 'sleep-promise';
import { promisify } from 'util';
import { createLogger } from './logger';
import redis from 'redis';
import { REDIS_HOST, REDIS_PORT } from './secrets';


/**
 * npm run test -- src/shared/util/logger.spec.ts
 */
describe('logger test', () => {
  const client = redis.createClient(REDIS_PORT, REDIS_HOST);
  afterAll(()=>{
    client.quit();
  })   
  it('should remove after expiration time.', async () => {
    await new Promise(res => client.once('ready', res));
    await promisify(client.flushall.bind(client))();

    const logger = createLogger({ expires_in: 2, container: 'expires_in' });

    logger.info('logging expiration test');

    await sleep(1000);

    var list = await promisify(client.lrange.bind(client))('expires_in', 0, -1);
    expect(list.length).toBe(1);

    await sleep(2000);

    var list = await promisify(client.lrange.bind(client))('expires_in', 0, -1);
    expect(list.length).toBe(0);
  });
});