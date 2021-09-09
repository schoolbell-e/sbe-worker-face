import { Redis } from '@schoolbell-e/backend.servers';
import {
  Message,
  PubSub as PubSubClient,
  Subscription,
} from '@google-cloud/pubsub';
import { defaults, identity, pickBy } from 'lodash';
import { promisify } from 'util';

class PubSub {
  client = new PubSubClient();
  constructor() {}
  async race(messageId: string, expire = 60 * 10) {
    const key = `race${messageId}`;
    const redis = await new Redis().getClient();
    if ((await promisify(redis.incr).bind(redis)(key)) === 1) {
      await promisify(redis.expire).bind(redis)(key, expire);
      return true;
    } else if (!(await promisify(redis.ttl).bind(redis)(key))) {
      await promisify(redis.expire).bind(redis)(key, expire);
      return false;
    } else {
      return false;
    }
  }

  async pull(
    topicName: string,
    subscriptionName: string,
    options?: { timeout?: number; should_race_message?: boolean },
  ) {
    const opts = defaults(options, { timeout: 60, should_race_message: true });

    let message: Message | null;
    try {
      message = await this._pull(subscriptionName, opts.timeout);
    } catch (error:any) {
      if (error.code === 5) {
        await this.createSubscription(topicName, subscriptionName);
        message = await this._pull(subscriptionName, opts.timeout);
      } else {
        console.error(error);
        throw error;
      }
    }
    // race messageId
    // to prevent one message from being processed by multiple workers as the same time.
    if (message && opts.should_race_message && !(await this.race(message.id))) return null;
    return message;
  }
  private async _pull(subscriptionName: string, timeout = 60) {
    const subscription = this.client.subscription(subscriptionName);
    return new Promise<Message | null>((resolve, reject) => {
      const setTimeoutKey = setTimeout(() => {
        resolve(null);
        subscription.removeListener('message', messageHandler);
      }, timeout * 1000);
      subscription.once('error', error => {
        if (setTimeoutKey) clearTimeout(setTimeoutKey);
        subscription.removeListener('message', messageHandler);
        reject(error);
      });
      const messageHandler = (message: Message) => {
        resolve(message);
        if (setTimeoutKey) clearTimeout(setTimeoutKey);
      };
      subscription.once('message', messageHandler);
    });
  }
  private async createSubscription(
    topicName: string,
    subscriptionName: string,
  ) {
    let subscription: Subscription;
    try {
      // message published before the creation of subscription will not reach the subscription.
      [subscription] = await this.client.createSubscription(
        topicName,
        subscriptionName,
      );
      return subscription;
    } catch (error:any) {
      if (error.code === 5) {
        const [topic] = await this.client.createTopic(topicName);
        [subscription] = await this.client.createSubscription(
          topic,
          subscriptionName,
        );
        return subscription;
      } else {
        throw error;
      }
    }
  }

  private async throttle(
    key: string,
    throttle_span: number = 24 * 60 * 60 * 1000,
    now: number = Date.now(),
  ) {
    const redis = await new Redis().getClient();
    const _scheduled = await promisify(redis.get).bind(redis)(key);
    const _ttl = await promisify(redis.ttl).bind(redis)(key);

    // use ttl to validate.
    const scheduled = _ttl && _scheduled ? Number(_scheduled) : null;

    if (!scheduled || scheduled + throttle_span <= now) {
      // Clear. no scheduled job or its taken a long ago. go ahead do it now.
      await promisify(redis.setex).bind(redis)(key, throttle_span, `${now}`);
      return true; // 'run now';
    } else if (scheduled <= now && now < scheduled + throttle_span) {
      // there was a job recently. take it with a delay.
      await promisify(redis.setex).bind(redis)(
        key,
        throttle_span,
        `${scheduled + throttle_span}`,
      );
      return scheduled + throttle_span;
    } else {
      // there is a scheduled job in the near future. no more scheduling.
      return false;
    }
    // else if (now < scheduled) { // there is a scheduled job in the near future. no more scheduling.
    //   return false;
    // }
  }
  async publish(
    topicName: string,
    data: string | { [key: string]: any },
    attr: { job: string; at?: number; throttle?: number },
  ) {
    let {
      job,
      at, // the time a job to be run
      throttle, // throttle time in ms.
    } = attr;
    let type: 'reserved' | 'delayed' | 'pushed' = 'pushed',
      message_id: string;
    if (typeof data !== 'string') data = JSON.stringify(data);
    if (typeof throttle === 'number') {
      const throttled = await this.throttle(
        `${topicName}:${data}`,
        throttle,
        at || Date.now(),
      );
      if (throttled === false) return { message_id: null, type: 'throttled' };
      else if (typeof throttled === 'number' && throttled) at = throttled;
    }
    if (at && at > Date.now() + 15 * 60 * 1000) {
      throw new Error("Exceeded the maximum delay time(15 min)");
      // (message_id = await QueueReservationTable.insert({
      //   topic: topicName,
      //   job: job as string,
      //   data,
      //   at,
      // })),
      //   (type = 'reserved');
      // return { message_id, type };
    } else if (at) {
      (topicName = 'delay'), (type = 'delayed');
    }

    try {
      message_id = await this._publish(topicName, data, {
        job,
        topic: topicName,
      });
    } catch (error:any) {
      if (error.code === 5) {
        await this.client.createTopic(topicName);
        message_id = await this._publish(topicName, data, {
          job,
          topic: topicName,
        });
      } else {
        console.error(error);
        throw error;
      }
    }
    return { message_id, type };
  }
  private async _publish(
    topicName: string,
    data: string,
    attr: { [key: string]: any },
  ) {
    // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
    const dataBuffer = Buffer.from(data);
    attr = pickBy(attr, identity);
    return await this.client.topic(topicName).publish(dataBuffer, attr);
  }
}
export default new PubSub();