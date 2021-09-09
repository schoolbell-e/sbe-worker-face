import winston from 'winston';
import dateFormat = require('dateformat');
import { ExtendedRedisTransport } from './logger-redis-transport';
import { REDIS_HOST, REDIS_PORT } from './secrets';
import { defaults, flatten } from 'lodash';

export type LoggerRedisOptions =
  | string
  | {
      host?: string;
      port?: number;
      container?: string;
      length?: number;
      expires_in?: number;
      filter?: winston.Logform.TransformFunction;
      level?: string;
    };

export function createLogger(
  redisOptions: LoggerRedisOptions | LoggerRedisOptions[] = {},
  defaultMeta?: { [key: string]: any },
) {
  const options: winston.LoggerOptions = {
    defaultMeta,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({
            format: () => dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss.l'),
          }),
          winston.format.colorize(),
          winston.format.printf(
            ({ level, message, label, timestamp }) =>
              `${timestamp} ${label || '-'} ${level}: ${message}`,
          ),
        ),
      }),
      ...flatten(
        (Array.isArray(redisOptions) ? redisOptions : [redisOptions]).map(
          redisOption => {
            if (typeof redisOption === 'string')
              redisOption = { container: redisOption };
            const opts = defaults(redisOption, {
              container: 'winston',
              length: 99,
              host: REDIS_HOST,
              port: REDIS_PORT,
              expires_in: undefined,
              filter: (info: winston.Logform.TransformableInfo) => info,
              level: 'info',
            });
            return [
              new ExtendedRedisTransport({
                format: winston.format.combine(
                  winston.format(opts.filter)(),
                  winston.format.timestamp({
                    format: () =>
                      dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss.l'),
                  }),
                  winston.format.printf(
                    ({ level, message, label, timestamp }) =>
                      `${timestamp} ${label || '-'} ${level}: ${message}`,
                  ),
                ),
                ...opts,
              }) as any,
              new ExtendedRedisTransport({
                format: winston.format.combine(
                  winston.format(opts.filter)(),
                  winston.format.timestamp({
                    format: () =>
                      dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss.l'),
                  }),
                  winston.format.printf(
                    ({ level, message, label, timestamp }) =>
                      `${timestamp} ${label || '-'} ${level}: ${message}`,
                  ),
                ),
                ...opts,
                level: 'warn',
                container: `WARNING:${opts.container}`,
              }) as any,
            ];
          },
        ),
      ),
    ],
  };
  const logger = winston.createLogger(options);
  logger.on('error', (e: Error) => console.error(e.message));
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Logging initialized at debug level');
  }
  return logger;
}
