import FaceReferencesTable from './FaceReferencesTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/FaceReferencesTable.spec.ts
 */
describe('FaceReferencesTable test', () => {
  const group_id = `0:1`;
  const scope = `studentparent_row_daniel`;
  let reference_id_1: string, reference_id_2: string;

  beforeAll(async () => {
    await FaceReferencesTable.truncate();
  });
  afterAll(()=>{
    REDIS.client.quit();
  })
  it('insert()', async () => {
    reference_id_1 = await FaceReferencesTable.insert({
      group_id,
      scope,
      descriptor: new Float32Array(2),
      img: 'a',
    });
    reference_id_2 = await FaceReferencesTable.insert({
      group_id,
      scope,
      descriptor: new Float32Array(2),
      img: 'b',
    });
    expect(reference_id_1 !== null).toBeTruthy();
    expect(reference_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    var list = await FaceReferencesTable.get({ group_id });
    expect(list.length === 2).toBeTruthy();
    var list = await FaceReferencesTable.get({ reference_id: reference_id_1 });
    expect(list.length === 1).toBeTruthy();
  });
  it('delete()', async () => {
    const affectedRow = await FaceReferencesTable.delete({ group_id });
    expect(affectedRow === 2).toBeTruthy();
  });
});