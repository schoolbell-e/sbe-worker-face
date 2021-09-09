import { padStart, uniq } from 'lodash';
import { MYSQL } from '@schoolbell-e/backend.servers';
import UsersTable from './UsersTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/UsersTable.spec.ts
 */
describe('UsersTable test', () => {
  beforeAll(async () => {
    await UsersTable.truncate();
  });
  afterAll(()=>{
    REDIS.client.quit();
  })  
  it('insert()', async () => {
    let cnt = 0;
    let hosts: number[] = [];
    while (cnt < 100) {
      const user_id = await UsersTable.insert({
        user_name: `user_${cnt}`,
        user_phone_number: `+8210000000${padStart('' + cnt, 2, '0')}`,
      });
      hosts.push(MYSQL.splitDatabaseIdAndValue(user_id)[0]);
      const user = (await UsersTable.get({ user_id }))[0];
      expect(user).toBeTruthy();
      expect(user_id === user.user_id).toBeTruthy();
      cnt++;
    }
    hosts = uniq(hosts);
    expect(hosts.length === 3).toBeTruthy();
  });
});