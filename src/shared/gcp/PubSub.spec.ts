import PubSub from './PubSub';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/gcp/PubSub.spec.ts
 */
describe('PubSub test', () => {
  const TOPIC_NAME = 'face-recognition';
  const SUBSCRIPTION_NAME = 'face-recognition';
  const DATA_STRING = 'hi!!';
  let message_id: string;
  beforeAll(async () => {
    while (true) {
      const message = await PubSub.pull(TOPIC_NAME, SUBSCRIPTION_NAME, {
        timeout: 1,
      });
      if (!message) break;
      message.ack();
    }
  });
  afterAll(()=>{
    REDIS.client.quit();
  })

  it('publish()', async () => {
    const ob = await PubSub.publish(TOPIC_NAME, DATA_STRING, { job: 'abc' });
    if (ob?.message_id) message_id = ob.message_id;
    console.log(ob);
    expect(typeof ob.message_id).toBe('string');
    expect(ob?.type).toBe('pushed');
  });
  it('pull()', async () => {
    const message = await PubSub.pull(TOPIC_NAME, SUBSCRIPTION_NAME, {
      timeout: 10,
    });
    if (message) {
      expect(message.data.toString()).toBe(DATA_STRING);
      expect(message.id).toBe(message_id);
      message.ack();
    }
    expect(message).toBeTruthy();
  }, 30000);
});