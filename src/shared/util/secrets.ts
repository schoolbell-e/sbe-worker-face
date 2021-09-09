import dotenv from 'dotenv';
import fs from 'fs';

export const ENVIRONMENT = process.env.NODE_ENV;

const prod = ENVIRONMENT === 'production'; // Anything else is treated as 'dev'
if (prod) {
  if (fs.existsSync('.env')) {
    console.debug('Using .env file to supply config environment variables');
    dotenv.config();
  } else {
    console.error('.env file not found.');
  }
} else {
  if (fs.existsSync('.env.example')) {
    console.debug(
      'Using .env.example file to supply config environment variables',
    );
    dotenv.config({ path: `.env.example` }); // you can delete this after you create your own .env file!
  }
  if (!process.env['PUBSUB_EMULATOR_HOST']) process.env['PUBSUB_EMULATOR_HOST'] = 'localhost:8085';
  if (!process.env['GCS_EMULATOR_HOST']) process.env['GCS_EMULATOR_HOST'] = 'http://localhost:4443';

  process.env['PUBSUB_PROJECT_ID'] = 'schoolbelle-ci';
  process.env['GCS_PROJECT_ID'] = 'test';
}

export const MYSQL_SOCKET_PATH =
  process.env['MYSQL_SOCKET_PATH'] || ('/cloudsql' as string);
export const MYSQL_PROJECT_NAME = process.env['MYSQL_PROJECT_NAME'] as string;
export const DEFAULT_MYSQL_HOST = process.env['DEFAULT_MYSQL_HOST'] as string;
export const SHARDED_MYSQL_HOSTS = process.env['SHARDED_MYSQL_HOSTS'];

export const CLOUDSQL_DATABASE =
  process.env['CLOUDSQL_DATABASE'] || ('schoolbelle' as string);
export const CLOUDSQL_USER = process.env['CLOUDSQL_USER'] as string;
export const CLOUDSQL_PASSWORD = process.env['CLOUDSQL_PASSWORD'] as string;

export const CLOUD_STOREAGE_BUCKET_NAME = process.env[
  'CLOUD_STOREAGE_BUCKET_NAME'
] as string;

export const REDIS_PORT = Number(process.env['REDIS_PORT'] || '6379');
export const REDIS_HOST = process.env['REDIS_HOST'] || 'localhost';

if (!DEFAULT_MYSQL_HOST) {
  if (prod) {
    console.error(
      'No mysql connection string. Set MOCK_REGION and GLOBAL_MYSQL_INSTANCE environment variable.',
    );
  } else {
    console.error(
      'No mysql connection string. Set MOCK_REGION_LOCAL and GLOBAL_MYSQL_INSTANCE_LOCAL environment variable.',
    );
  }
  process.exit(1);
}