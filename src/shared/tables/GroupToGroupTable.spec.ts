import GroupToGroupTable from './GroupToGroupTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/GroupToGroupTable.spec.ts
 */
describe('GroupToGroupTable test', () => {
  const parent_id = `0:1`;
  const child_id1 = `0:2`;
  const child_id2 = `0:3`;

  let gtg_id_1: string, gtg_id_2: string;

  beforeAll(async () => {
    await GroupToGroupTable.truncate();
  });
  afterAll(()=>{
    REDIS.client.quit();
  })  
  it('insert()', async () => {
    gtg_id_1 = await GroupToGroupTable.insert({
      parent_id,
      child_id: child_id1,
    });
    gtg_id_2 = await GroupToGroupTable.insert({
      parent_id,
      child_id: child_id2,
    });
    expect(gtg_id_1 !== null).toBeTruthy();
    expect(gtg_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    var list = await GroupToGroupTable.get({ gtg_id: gtg_id_1 });
    expect(list.length === 1).toBeTruthy();
    var list = await GroupToGroupTable.get({ child_id: child_id1 });
    expect(list.length === 1).toBeTruthy();
    var list = await GroupToGroupTable.get({ child_id: child_id2 });
    expect(list.length === 1).toBeTruthy();
    var list = await GroupToGroupTable.get({ parent_id });
    expect(list.length === 2).toBeTruthy();
  });

  it('delete()', async () => {
    var affectedRow = await GroupToGroupTable.delete({ child_id: child_id1 });
    expect(affectedRow === 1).toBeTruthy();
    var affectedRow = await GroupToGroupTable.delete({ parent_id });
    expect(affectedRow === 1).toBeTruthy();
  });
});