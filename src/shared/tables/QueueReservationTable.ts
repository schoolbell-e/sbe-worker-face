import { AbstractTable } from './AbstractTable';

export type QueueReservationItem = {
  reservation_id: string;
  topic: string;
  job: string;
  data: { [key: string]: any };
  at: number;
  task_id: string;
};

class QueueReservationTable extends AbstractTable {
  table_name = 'queue_reservation';
  id_fields = ['reservation_id'];
  async get(params: { reservation_id?: string | string[] }) {
    const { reservation_id } = params;
    if (!reservation_id) throw new Error('Not enough params.');
    const list = await this._get({ deleted_at: null, ...params }, 0);
    return list.map(li => {
      return { ...li, data: JSON.parse(li.data) };
    }) as QueueReservationItem[];
  }
  async insert(params: {
    topic: string;
    job: string;
    data: string | { [key: string]: any };
    at?: number | Date;
  }): Promise<string> {
    let { job, data, at } = params;
    if (typeof at === 'number') at = new Date(at);
    if (typeof data === 'object') data = JSON.stringify(data);
    if (!job || !data) throw new Error('Not enough params.');
    return await this._insert({ job, data, at }, 0);
  }
  async update(
    params: { task_id: string },
    conditions: { reservation_id: string },
  ): Promise<number> {
    const { reservation_id } = conditions;
    if (!reservation_id) throw new Error('Not enough params.');
    return await this._update(
      { ...params, deleted_at: new Date() },
      conditions,
      0,
    );
  }
}

export default new QueueReservationTable();
