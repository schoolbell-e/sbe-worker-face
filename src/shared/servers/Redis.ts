import redis from 'redis';
import { promisify } from 'util';
import { REDIS_HOST, REDIS_PORT } from '@schoolbell-e/backend.util';

declare module 'util' {
  function promisify<T, U, R>(
    fn: redis.OverloadedCommand<T, U, R>,
  ): {
    (arg1: T, arg2: T | T[]): Promise<U>;
    (arg1: T | T[]): Promise<U>;
    (...args: Array<T>): Promise<U>;
  };
}

export class Redis {
    public client!: redis.RedisClient;
    private ready!: Promise<any>;

    constructor(
        private initOptions: { [key: string]: any } = {}
    ) {
      this.init();
    }
    async init (refreshForce:boolean = false) {
        if (
            refreshForce === false &&
            typeof this.client !== "undefined"
        ) return await this.ready;

        this.client = redis.createClient(REDIS_PORT, REDIS_HOST, {
            enable_offline_queue: false, // this is required to be false for rate limiting.
            return_buffers: false, // this is required to be true for desriptor buffer saving
            ...this.initOptions,
        });
        this.client.on('error', err => {
            console.error({ REDIS_PORT, REDIS_HOST });
            console.error('Error ' + err);
        });
    
        this.ready = new Promise(resolve => {
            this.client.once('ready', e => {
                resolve(null);
            });
        });

        return await this.ready;
    }
    async getClient() {
        await this.init();
        return this.client;
    }
    async healthcheck ():Promise<boolean> {
        try {
          const client = await this.getClient();
          const res = await promisify(client.ping).bind(client)() as any;
          return res === 'PONG';
        }
        catch (e:any) {
          return false;
        } 
    }    
}
export default new Redis();