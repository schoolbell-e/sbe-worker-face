import CloudStorage from './CloudStorage';
import fs from 'fs';
import { CLOUD_STOREAGE_BUCKET_NAME } from '@schoolbell-e/backend.util';
import { Storage } from '@google-cloud/storage';
import tmp from 'tmp';

/**
 * npm run test -- src/shared/gcp/CloudStorage.spec.ts
 */
describe('CloudStorage test', () => {
  const FILE_PATH = tmp.fileSync().name;
  const OBJECT_NAME = `test.txt`;
  const FILE_NAME_FROM_FILE_PATH = FILE_PATH.split('/').pop() as string;
  const storage = new Storage({
    apiEndpoint:process.env['GCS_EMULATOR_HOST'] || undefined,
    projectId:process.env['STORAGE_PROJECT_ID']
  });

  beforeAll(async () => {
    fs.writeFileSync(FILE_PATH, 'test content');
  }, 10000);
  afterAll(async () => {
    if (fs.existsSync(FILE_PATH)) fs.unlinkSync(FILE_PATH);
    try {
      await storage
        .bucket(CLOUD_STOREAGE_BUCKET_NAME)
        .file(FILE_NAME_FROM_FILE_PATH)
        .delete();
    } catch (e:any) {}
    try {
      await storage
        .bucket(CLOUD_STOREAGE_BUCKET_NAME)
        .file(OBJECT_NAME)
        .delete();
    } catch (e:any) {}
  });

  it('upload()', async () => {


    await CloudStorage.upload(
      FILE_PATH,
      OBJECT_NAME,
      CLOUD_STOREAGE_BUCKET_NAME,
    );

    const bucket = storage
      .bucket(CLOUD_STOREAGE_BUCKET_NAME)
      const [exists0] = await bucket.exists();
      expect(exists0).toBeTruthy();

    const object1 = storage
      .bucket(CLOUD_STOREAGE_BUCKET_NAME)
      .file(OBJECT_NAME);
    const [exists1] = await object1.exists();
    expect(exists1).toBeTruthy();
    await CloudStorage.upload(FILE_PATH);

    const FILE_NAME_FROM_FILE_PATH = FILE_PATH.split('/').pop() as string;
    const object2 = storage
      .bucket(CLOUD_STOREAGE_BUCKET_NAME)
      .file(FILE_NAME_FROM_FILE_PATH);
    const [exists2] = await object2.exists();
    expect(exists2).toBeTruthy();
  }, 10000);

  it('download()', async () => {
    fs.unlinkSync(FILE_PATH);
    await CloudStorage.download(
      OBJECT_NAME,
      FILE_PATH,
      CLOUD_STOREAGE_BUCKET_NAME,
    );
    expect(fs.existsSync(FILE_PATH)).toBeTruthy();
  }, 10000);
});