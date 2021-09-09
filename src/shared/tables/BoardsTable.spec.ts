import BoardsTable from './BoardsTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/BoardsTable.spec.ts
 */
describe('BoardsTable test', () => {
  const group_id = `0:1`;
  const user_id = `0:1`;

  let board_id_1: string, board_id_2: string;

  beforeAll(async () => {
    await BoardsTable.truncate();
  });
  afterAll(()=>{
    REDIS.client.quit();
  })
  it('insert()', async () => {
    board_id_1 = await BoardsTable.insert({
      board_type: 'classnews',
      group_id,
      user_id,
    });
    board_id_2 = await BoardsTable.insert({
      board_type: 'photo',
      group_id,
      user_id,
    });
    expect(board_id_1 !== null).toBeTruthy();
    expect(board_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    const list = await BoardsTable.get({ group_id });
    expect(list.length === 2).toBeTruthy();
  });
  it('supplementWithDefaultBoards()', async () => {
    let list = await BoardsTable.get({ group_id });
    expect(list.length === 2).toBeTruthy();
    list = BoardsTable.supplementWithDefaultBoards(list, 'class');
    expect(list.length === 3).toBeTruthy();
  });

  it('delete()', async () => {
    const affectedRow = await BoardsTable.delete({ group_id });
    expect(affectedRow === 2).toBeTruthy();
  });
});