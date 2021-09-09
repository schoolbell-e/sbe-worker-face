import QueueReservationTable from './QueueReservationTable';
import { REDIS } from '@schoolbell-e/backend.servers';
/**
 * npm run test -- src/shared/tables/QueueReservationTable.spec.ts
 */
describe('QueueReservationTable test', () => {
  const data = JSON.stringify({ a: 'a' });
  let reservation_id_1: string, reservation_id_2: string;

  beforeAll(async () => {
    await QueueReservationTable.truncate();
  });
  afterAll(()=>{
    REDIS.client.quit();
  })  
  it('insert()', async () => {
    reservation_id_1 = await QueueReservationTable.insert({
      topic: 'a',
      job: 'a',
      data,
      at: Date.now() + 6 * 60 * 60 * 1000,
    });
    reservation_id_2 = await QueueReservationTable.insert({
      topic: 'a',
      job: 'a',
      data,
      at: Date.now() + 6 * 60 * 60 * 1000,
    });
    expect(reservation_id_1 !== null).toBeTruthy();
    expect(reservation_id_2 !== null).toBeTruthy();
  });

  it('get()', async () => {
    var list = await QueueReservationTable.get({
      reservation_id: reservation_id_1,
    });
    expect(list.length === 1).toBeTruthy();
    var list = await QueueReservationTable.get({
      reservation_id: [reservation_id_1, reservation_id_2],
    });
    expect(list.length === 2).toBeTruthy();
  });

  it('update()', async () => {
    var affectedRow = await QueueReservationTable.update(
      { task_id: 'a' },
      { reservation_id: reservation_id_1 },
    );
    expect(affectedRow === 1).toBeTruthy();
    var affectedRow = await QueueReservationTable.update(
      { task_id: 'a' },
      { reservation_id: reservation_id_2 },
    );
    expect(affectedRow === 1).toBeTruthy();
  });
});