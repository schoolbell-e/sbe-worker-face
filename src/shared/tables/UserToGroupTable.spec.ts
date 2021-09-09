import { SHARDED_MYSQL_HOSTS } from '@schoolbell-e/backend.util';
import { REDIS } from '@schoolbell-e/backend.servers';
import UserToGroupTable from './UserToGroupTable';

/**
 * npm run test -- src/shared/tables/UserToGroupTable.spec.ts
 */
describe('UserToGroupTable test', () => {
  const user_id = `0:1`;
  const group_id1 = `${SHARDED_MYSQL_HOSTS?.split(',')[0]}:1`;
  const group_id2 = `${SHARDED_MYSQL_HOSTS?.split(',')[1]}:1`;
  let utg_id_1: string, utg_id_2: string;

  beforeAll(async () => {
    await UserToGroupTable.truncate();
  });
  afterAll(()=>{
    REDIS.client.quit();
  })  
  it('insert()', async () => {
    utg_id_1 = await UserToGroupTable.insert({ user_id, group_id: group_id1 });
    utg_id_2 = await UserToGroupTable.insert({ user_id, group_id: group_id2 });
    expect(utg_id_1 !== null).toBeTruthy();
    expect(utg_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    var list = await UserToGroupTable.get({ utg_id: utg_id_1 });
    expect(list.length).toBe(1);

    var list = await UserToGroupTable.get({ user_id });
    expect(list.length).toBe(2);

    var list = await UserToGroupTable.get({ group_id: group_id1 });
    expect(list.length).toBe(1);

    var list = await UserToGroupTable.get({ group_id: group_id2 });
    expect(list.length).toBe(1);
  });

  it('delete()', async () => {
    const affectedRow = await UserToGroupTable.delete({ user_id });
    expect(affectedRow).toBe(2);
  });
});