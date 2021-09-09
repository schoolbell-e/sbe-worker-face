import { uniq } from 'lodash';
import Mysql from './Mysql';

/**
 * npm run test -- src/shared/servers/Mysql.spec.ts
 */
describe('Mysql test', () => {
  it('Test multiple shareds', async () => {
    let cnt = 0;
    let host_list: number[] = [];
    while (cnt < 100) {
      const pool = (await Mysql.getPools(undefined, true))[0];
      host_list.push(pool.db_id);
      cnt++;
    }
    host_list = uniq(host_list);
    expect(host_list.length).toBe(3);
  });
  it('test healthcheck', async () => {
    var bool = await Mysql.healthcheck();
    expect(bool).toBeTruthy();
  })
});
