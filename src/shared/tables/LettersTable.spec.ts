import LettersTable from './LettersTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/LettersTable.spec.ts
 */
describe('LettersTable test', () => {
  const within = `0:1`;
  const created_by = `0:1`;

  let letter_id_1: string, letter_id_2: string;

  beforeAll(async () => {
    const row = await LettersTable.delete({ within });
  });
  afterAll(()=>{
    REDIS.client.quit();
  })
  it('insert()', async () => {
    letter_id_1 = await LettersTable.insert({
      title: 'title',
      type: 'photo',
      within,
      created_by,
    });
    letter_id_2 = await LettersTable.insert({
      title: 'title',
      type: 'photo',
      within,
      created_by,
    });
    expect(letter_id_1 !== null).toBeTruthy();
    expect(letter_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    const list = await LettersTable.get({ letter_id: letter_id_1 });
    expect(list.length === 1).toBeTruthy();
  });

  it('delete()', async () => {
    const affectedRow = await LettersTable.delete({ within });
    expect(affectedRow === 2).toBeTruthy();
  });
});