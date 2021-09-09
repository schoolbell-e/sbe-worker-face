import GroupsTable from './GroupsTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/GroupsTable.spec.ts
 */
describe('GroupsTable test', () => {
  const creator_id = `0:1`;

  let group_id_1: string, group_id_2: string;
  afterAll(()=>{
    REDIS.client.quit();
  })
  it('insert()', async () => {
    group_id_1 = await GroupsTable.insert({
      group_name: 'group_name',
      type: 'school.high',
      creator_id,
    });
    group_id_2 = await GroupsTable.insert({
      group_name: 'group_name',
      type: 'school.high',
      creator_id,
    });
    expect(group_id_1 !== null).toBeTruthy();
    expect(group_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    var list = await GroupsTable.get({ group_id: group_id_1 });
    expect(list.length === 1).toBeTruthy();
    var list = await GroupsTable.get({ group_id: group_id_2 });
    expect(list.length === 1).toBeTruthy();
  });

  it('delete()', async () => {
    const affectedRow = await GroupsTable.delete({
      group_id: [group_id_1, group_id_2],
    });
    expect(affectedRow === 2).toBeTruthy();
  });
});