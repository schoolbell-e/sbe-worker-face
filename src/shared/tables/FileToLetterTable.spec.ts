import FileToLetterTable from './FileToLetterTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/FileToLetterTable.spec.ts
 */
describe('FileToLetterTable test', () => {
  const letter_id = `0:1`;
  const file_id1 = `0:1`;
  const file_id2 = `0:2`;
  const file_id3 = `0:3`;
  let ltf_id_1: string, ltf_id_2: string;

  beforeAll(async () => {
    await FileToLetterTable.truncate();
  });
  afterAll(()=>{
    REDIS.client.quit();
  })
  it('insert()', async () => {
    ltf_id_1 = await FileToLetterTable.insert({
      letter_id,
      file_id: file_id1,
      priority: 0,
    });
    ltf_id_2 = await FileToLetterTable.insert({
      letter_id,
      file_id: file_id2,
      priority: 1,
    });
    expect(ltf_id_1 !== null).toBeTruthy();
    expect(ltf_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    var list = await FileToLetterTable.get({ ltf_id: ltf_id_1 });
    expect(list.length === 1).toBeTruthy();
    var list = await FileToLetterTable.get({ letter_id });
    expect(list.length === 2).toBeTruthy();
  });
  it('changeFileList()', async () => {
    const res = await FileToLetterTable.changeFileList({
      letter_id: letter_id,
      files: [
        { file_id: file_id2, priority: 0 },
        { file_id: file_id3, priority: 1 },
      ],
    });
    expect(res.insert_cnt === 1).toBeTruthy();
    expect(res.update_cnt === 1).toBeTruthy();
    expect(res.delete_cnt === 1).toBeTruthy();
  });

  it('delete()', async () => {
    const affectedRow = await FileToLetterTable.delete({ letter_id });
    expect(affectedRow === 2).toBeTruthy();
  });
});