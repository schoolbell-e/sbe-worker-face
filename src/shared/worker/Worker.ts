import { AbstractJob } from "./AbstractJob";
import { PubSub } from "@schoolbell-e/backend.gcp";
import { createLogger, LoggerRedisOptions } from "@schoolbell-e/backend.util";
import winston from 'winston';
import { Redis } from "@schoolbell-e/backend.servers";
import { promisify } from "util";
import { Message } from "@google-cloud/pubsub";
import { v4 as uuid } from 'uuid';
import { defaults } from "lodash";

export class Worker {
  public id = uuid();
  public MAX_LOOP_CNT = 100;
  public PULL_TIMEOUT = 60;
  public MAX_RETRY_CNT = 5;
  public loop_cnt = 0;
  public status!:NodeJS.Signals;
  logger:winston.Logger
  constructor (
    public TOPIC_NAME:string,
    public SUBSCRIPTION_NAME:string,
    public jobs:{[job:string]:new (worker_id?:string, message_id?: string, retry_cnt?:number, log_expires_in?:number) => AbstractJob} = {},
    public LOG_EXPIRES_IN?:number
    ) {
    this.logger = this.createLogger();
    process.on('SIGTERM', () => {
      this.logger.info(`SIGTERM is received (${this.id})`);
      this.status = 'SIGTERM';
    });
  }
  createLogger () {
    const options:LoggerRedisOptions[] = [
      {
        container:`WORKER`, 
      },
      {
        container:`WORKER:${this.TOPIC_NAME}`, 
      },
      {
        level:'verbose',
        container:`WORKER:${this.TOPIC_NAME}:${this.id}`, 
        expires_in: this.LOG_EXPIRES_IN || 7 * 24 * 60 * 60, 
      }
    ];
    return createLogger(options, {worker_id:this.id, topic_name:this.TOPIC_NAME, subscription_name:this.SUBSCRIPTION_NAME});
  }  
  async run (options?:{should_neck?:boolean, should_race_message?:boolean}) {
    const opts = defaults(options, {should_neck:false, should_race_message:true});
    while(this.loop_cnt < this.MAX_LOOP_CNT) {

      // check before going into a long session
      if (['SIGTERM'].includes(this.status)) {
        this.logger.info(`${this.status} is received. Stopping the loop.`);
        break;
      }  
      this.loop_cnt ++;

      this.logger.info(`${this.loop_cnt}th iteration is staring...`);

      const message = await PubSub.pull(this.TOPIC_NAME, this.SUBSCRIPTION_NAME, {timeout:this.PULL_TIMEOUT, should_race_message:opts.should_race_message});

      // check before going into a long session
      if (['SIGTERM'].includes(this.status)) {
        message?.nack();
        this.logger.info(`${this.status} is received. Stopping the loop.`);
        break;
      }  

      if (message) {
        // handle params
        let params, attributes:{[key:string]:string} = message.attributes || {}, job:AbstractJob|undefined;
        try {
          params = message.data.toString();
          params = JSON.parse(params);
        }
        catch (e) {}  

        // perform
        let setIntervalKey = setInterval(()=>{
          message.modAck(60);
        }, 30 * 1000)
        try {
          let job_name:string|undefined = attributes && attributes.job || undefined;
          const [valid_to_retry, retry_cnt] = await this.validateRetryCount(message);
          if (!valid_to_retry) {
            this.logger.error(`Failed too many times (${retry_cnt + 1 - 1}/${this.MAX_RETRY_CNT + 1})`);
            message.ack();
          }
          else if (!job_name) {
            this.logger.error(`Property job is not found in message.attributes.`);
            message.ack();
          }
          else if (!this.jobs[job_name]) {
            this.logger.error(`Job(${job_name}) is not found.`);
            message.ack();
          }
          else {
            job = new this.jobs[job_name](this.id, message.id, retry_cnt);
            // params.args is here to be compatible with old scheme.
            if (job) await job.perform(params.args || params);
            message.ack();
          }
          clearInterval(setIntervalKey);
        } catch (error) {
          // nack instantly sends it back to the queue. We want some delay between tries.
          if (opts.should_neck) message.nack();
          // this.logger.error(error.stack);
          clearInterval(setIntervalKey);
        
        }
      }  

      this.logger.info(`${this.loop_cnt}th iteration is finished...`)
    }
    this.logger.info(`Worker has reached its iteration limit.`)
  }

  // async validateRetryCount (message:Message):Promise<[v1:boolean, v2:number]> {
  async validateRetryCount (message:Message):Promise<any[]> {
    // should not depend on Redis
    try {
      const redisKey = `job_try_cnt|${message.id}`;
      const redis = await new Redis().getClient();
      const retry_cnt = (await promisify(redis.incr.bind(redis))(redisKey)) as number - 1;
  
      const expire_in = 60 * 60;
      await promisify(redis.expire.bind(redis))(redisKey, expire_in);
  
      if (retry_cnt > this.MAX_RETRY_CNT) {
        await this.pushToFailureBucket(message);
        return [ false, retry_cnt]
      }
      return [ true, retry_cnt];
    }
    catch (e) {
      return [true, 0];
    }
  }   
  
  async pushToFailureBucket (message: Message, capsize: number =100) {

    let params, attributes:{[key: string]: string} = {}, job: string = '';
    try {
      params = message.data.toString();
      params = JSON.parse(params);
      attributes = message.attributes || {};
      job = attributes.job;
    }
    catch (e) {}  

    const key = 'FAILURE';
    const value = JSON.stringify({
      worker:this.TOPIC_NAME,
      task_id : message.id,
      args:params,
      job,
      timestamp:Date.now(),
    }); 
    const redis = await new Redis().getClient();
    await promisify(<any>redis.rpush.bind(redis))(key, value);
    if (capsize) await promisify(redis.ltrim.bind(redis))(key, -capsize, -1);
  }

}
