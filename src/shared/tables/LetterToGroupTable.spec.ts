import LetterToGroupTable from './LetterToGroupTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/LetterToGroupTable.spec.ts
 */
describe('LetterToGroupTable test', () => {
  const group_id = `0:1`;
  const letter_id1 = `0:1`;
  const letter_id2 = `0:2`;
  const board_type = 'photo';
  let ltg_id_1: string, ltg_id_2: string;

  beforeAll(async () => {
    const row = await LetterToGroupTable.delete({ group_id });
  });
  afterAll(()=>{
    REDIS.client.quit();
  })
  it('insert()', async () => {
    ltg_id_1 = await LetterToGroupTable.insert({
      group_id,
      board_type,
      letter_id: letter_id1,
    });
    ltg_id_2 = await LetterToGroupTable.insert({
      group_id,
      board_type,
      letter_id: letter_id2,
    });
    expect(ltg_id_1 !== null).toBeTruthy();
    expect(ltg_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    const list = await LetterToGroupTable.get({ ltg_id: ltg_id_1 });
    expect(list.length === 1).toBeTruthy();
  });

  it('delete()', async () => {
    const affectedRow = await LetterToGroupTable.delete({
      group_id,
      board_type,
    });
    expect(affectedRow === 2).toBeTruthy();
  });
});