import BoardCrawlRulesTable, { CrawlingTargets } from './BoardCrawlRulesTable';
import GroupsTable from './GroupsTable';
import UsersTable from './UsersTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/BoardCrawlRulesTable.spec.ts
 */
describe('BoardCrawlRulesTable test', () => {
  let user_id: string, group_id: string;
  const data = {
    url: 'url',
    clicks: [],
    targets: { foo: { selector: 'ba', type: 'static' } } as CrawlingTargets,
  };

  let rule_id_1: string, rule_id_2: string;

  beforeAll(async () => {
    await UsersTable.truncate();
    await GroupsTable.truncate();
    await BoardCrawlRulesTable.truncate();

    user_id = await UsersTable.insert({
      user_name: 'user_name',
      user_phone_number: '+821000000000',
    });
    group_id = await GroupsTable.insert({
      group_name: 'group_name',
      type: 'class',
      creator_id: user_id,
    });
  });
  afterAll(()=>{
    REDIS.client.quit();
  })

  it('insert()', async () => {
    rule_id_1 = await BoardCrawlRulesTable.insert({
      board_type: 'classnews',
      group_id,
      user_id,
      data,
    });
    rule_id_2 = await BoardCrawlRulesTable.insert({
      board_type: 'photo',
      group_id,
      user_id,
      data,
    });
    expect(rule_id_1 !== null).toBeTruthy();
    expect(rule_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    var list = await BoardCrawlRulesTable.get({
      group_id,
      board_type: 'classnews',
    });
    expect(list.length === 1).toBeTruthy();
    var list = await BoardCrawlRulesTable.get({
      group_id,
      board_type: 'photo',
    });
    expect(list.length === 1).toBeTruthy();
    var list = await BoardCrawlRulesTable.get({ group_id });
    expect(list.length === 2).toBeTruthy();
  });

  it('delete()', async () => {
    const affectedRow = await BoardCrawlRulesTable.delete({ group_id });
    expect(affectedRow === 2).toBeTruthy();
  });
});