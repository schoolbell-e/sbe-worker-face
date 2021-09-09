import MembersTable from './MembersTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/MembersTable.spec.ts
 */
describe('MembersTable test', () => {
  const group_id = `0:1`;

  let member_id_1: string, member_id_2: string;

  beforeAll(async () => {
    await MembersTable.delete({ group_id });
  });
  afterAll(()=>{
    REDIS.client.quit();
  })
  it('insert()', async () => {
    member_id_1 = await MembersTable.insert({
      member_type: 'a',
      group_id,
      member_num: 1,
    });
    member_id_2 = await MembersTable.insert({
      member_type: 'a',
      group_id,
      member_num: 2,
    });
    expect(member_id_1 !== null).toBeTruthy();
    expect(member_id_2 !== null).toBeTruthy();

    // should not insert a duplicate value.
    const member_id_3 = await MembersTable.insert({
      member_type: 'a',
      group_id,
      member_num: 2,
    }).catch(e => null);
    expect(member_id_3 === null).toBeTruthy();

    // if name is not specified, it can be added without worrying about duplicacy
    const member_id_4 = await MembersTable.insert({
      member_type: 'b',
      group_id,
    }).catch(e => null);
    expect(member_id_4 !== null).toBeTruthy();
    const member_id_5 = await MembersTable.insert({
      member_type: 'b',
      group_id,
    }).catch(e => null);
    expect(member_id_5 !== null).toBeTruthy();
  });

  it('get()', async () => {
    const list = await MembersTable.get({ group_id });
    expect(list.length === 4);
  });

  it('delete()', async () => {
    const affectedRow = await MembersTable.delete({ group_id });
    expect(affectedRow === 4);
  });
});