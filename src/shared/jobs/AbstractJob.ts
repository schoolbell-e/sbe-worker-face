import winston from 'winston';
import { createLogger, LoggerRedisOptions } from '@schoolbell-e/backend.util';

export class AbstractJob {
  logger: winston.Logger;
  constructor(
    public worker_id?: string,
    public message_id?: string,
    public retry_cnt?: number,
    public LOG_EXPIRES_IN?: number,
  ) {
    this.logger = this.createLogger(this.constructor.name, message_id);
  }
  async perform(params?: any): Promise<any> {
    this.logger.info('Started.', params);
    this.logger.info('Succeeded.', params);
  }

  createLogger(
    job_name: string,
    message_id?: string,
    defaultMeta: { [key: string]: any } = {},
  ) {
    const options: LoggerRedisOptions[] = [
      {
        container: `JOB`,
      },
      {
        container: `JOB:${job_name}`,
      },
    ];
    if (message_id) {
      options.push({
        level: 'verbose',
        container: `JOB:${job_name}:${message_id}`,
        expires_in: this.LOG_EXPIRES_IN || 7 * 24 * 60 * 60,
      });
    }

    return createLogger(options, {
      worker_id: this.worker_id,
      job_name,
      message_id,
      ...defaultMeta,
    });
  }
}
