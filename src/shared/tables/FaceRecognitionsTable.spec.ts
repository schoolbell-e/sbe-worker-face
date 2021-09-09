import FaceRecognitionsTable from './FaceRecognitionsTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/FaceRecognitionsTable.spec.ts
 */
describe('FaceRecognitionsTable test', () => {
  const file_id = `0:1`;
  const face_id_1 = `0:1`;
  const face_id_2 = `0:2`;
  const reference_id_1 = `0:1`;
  const reference_id_2 = `0:2`;
  let recognition_id_1: string, recognition_id_2: string;
  beforeAll(async () => {
    await FaceRecognitionsTable.truncate();
  });
  afterAll(()=>{
    REDIS.client.quit();
  })
  it('insert()', async () => {
    recognition_id_1 = await FaceRecognitionsTable.insert({
      file_id,
      face_id: face_id_1,
      reference_id: reference_id_1,
      distance: 1,
    });
    recognition_id_2 = await FaceRecognitionsTable.insert({
      file_id,
      face_id: face_id_2,
      reference_id: reference_id_2,
      distance: 1,
    });
    expect(recognition_id_1 !== null).toBeTruthy();
    expect(recognition_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    var list = await FaceRecognitionsTable.get({ file_id });
    expect(list.length === 2).toBeTruthy();
    var list = await FaceRecognitionsTable.get({
      recognition_id: recognition_id_1,
    });
    expect(list.length === 1).toBeTruthy();
  });
  it('delete()', async () => {
    const affectedRow = await FaceRecognitionsTable.delete({ file_id });
    expect(affectedRow === 2).toBeTruthy();
  });
});