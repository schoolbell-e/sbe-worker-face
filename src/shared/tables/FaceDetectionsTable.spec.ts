import { REDIS } from '@schoolbell-e/backend.servers';
import FaceDetectionsTable from './FaceDetectionsTable';

/**
 * npm run test -- src/shared/tables/FaceDetectionsTable.spec.ts
 */
describe('FaceDetectionsTable test', () => {
  const file_id = `0:1`;
  let face_id_1: string, face_id_2: string;
  beforeAll(async () => {
    await FaceDetectionsTable.truncate();
  });
  afterAll(()=>{
    REDIS.client.quit();
  })

  it('insert()', async () => {
    face_id_1 = await FaceDetectionsTable.insert({
      file_id,
      box: { foo: 'ba' },
      score: 1,
    });
    face_id_2 = await FaceDetectionsTable.insert({
      file_id,
      box: { foo: 'ba' },
      score: 1,
    });
    expect(face_id_1 !== null).toBeTruthy();
    expect(face_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    var list = await FaceDetectionsTable.get({ file_id });
    expect(list.length === 2).toBeTruthy();
    var list = await FaceDetectionsTable.get({ face_id: face_id_1 });
    expect(list.length === 1).toBeTruthy();
  });

  it('delete()', async () => {
    const affectedRow = await FaceDetectionsTable.delete({ file_id });
    expect(affectedRow === 2).toBeTruthy();
  });
});