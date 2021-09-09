import { RedisClient } from 'redis';
import { TransportStreamOptions } from 'winston-transport';
const RedisTransport = require('winston-redis');
const async = require('async');

export class ExtendedRedisTransport extends RedisTransport {
  redis!: RedisClient;
  expires_in?: number;
  container: any;
  metadata: any;
  channel: any;
  flatMeta: any;
  length: any;
  constructor(
    options?: TransportStreamOptions & {
      host?: string;
      port?: number;
      container?: string;
      length?: number;
    } & { expires_in?: number },
  ) {
    super(options);
    if (options && options.expires_in) this.expires_in = options.expires_in;
  }
  //
  // ### function log (level, msg, [meta], callback)
  // #### @level {string} Level at which to log the message.
  // #### @msg {string} Message to log
  // #### @meta {Object} **Optional** Additional metadata to attach
  // #### @callback {function} Continuation to respond to when complete.
  // Core logging method exposed to Winston. Metadata is optional.
  //
  async log(info: any, callback: any) {

    const { level, message, ...winstonMeta } = info;
    const meta = Object.assign({}, winstonMeta, this.metadata);

    const container = this.container(meta);
    const channel = this.channel && this.channel(meta);

    const output = this.flatMeta
      ? meta[
          Object.getOwnPropertySymbols(meta).find(
            s => String(s) === 'Symbol(message)',
          ) as symbol
        ]
      : JSON.stringify({ level, message, meta });
    
    
    const expires_in = this.expires_in;
    async.series([
      (cb:any) => this.redis.lpush(container, output, cb),
      (cb:any) => this.redis.ltrim(container, 0, this.length, cb),
      expires_in ? (cb:any) => this.redis.expire(container, expires_in, cb) : null,
    ].filter(v=>v), (err:any) => {
      if (err) {
        if (callback) callback(err, false);
        return this.emit('error', err);
      }

      if (channel) {
        this.redis.publish(channel, output);
      }

      this.emit('logged', info);

      // Perform the writing to the remote service
      if (callback) callback(null, true);
    });      
  }
}
