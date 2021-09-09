import FilesTable from './FilesTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/FilesTable.spec.ts
 */
describe('FilesTable test', () => {
  const account_id = `0:g1`;
  let file_id_1: string, file_id_2: string;
  beforeAll(async () => {
    await FilesTable.truncate();
  });
  afterAll(()=>{
    REDIS.client.quit();
  })  
  it('insert()', async () => {
    file_id_1 = await FilesTable.insert({
      account_id,
      name: 'a',
      size: 1,
      type: 'a',
    });
    file_id_2 = await FilesTable.insert({
      account_id,
      name: 'b',
      size: 1,
      type: 'a',
    });
    expect(file_id_1 !== null).toBeTruthy();
    expect(file_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    var list = await FilesTable.get({ file_id: file_id_1 });
    expect(list.length === 1).toBeTruthy();

    var list = await FilesTable.get({ file_id: [file_id_1, file_id_2] });
    expect(list.length === 2).toBeTruthy();
  });
  it('update()', async () => {
    const affectedRow = await FilesTable.update(
      {
        name: 'b',
        size: 2,
        type: 'b',
        gs_name: 'b',
        face_detected: 1,
      },
      { file_id: file_id_1 },
    );
    expect(affectedRow === 1).toBeTruthy();

    const li = (await FilesTable.get({ file_id: file_id_1 }))[0];
    expect(li.name === 'b').toBeTruthy();
    expect(li.size === 2).toBeTruthy();
    expect(li.type === 'b').toBeTruthy();
    expect(li.gs_name === 'b').toBeTruthy();
    expect(li.face_detected === 1).toBeTruthy();
  });
  it('delete()', async () => {
    const affectedRow = await FilesTable.delete({ account_id });
    expect(affectedRow === 2).toBeTruthy();
  });
});