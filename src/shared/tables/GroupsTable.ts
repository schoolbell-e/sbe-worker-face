import { AbstractTable } from './AbstractTable';

export type GroupItem = {
  group_id: string;
  type: string;
  group_name: string;
};

class GroupsTable extends AbstractTable {
  table_name = 'groups';
  id_fields = ['group_id', 'creator_id'];

  async get(params: { group_id?: string | string[] }) {
    const { group_id } = params;
    if (!group_id || !group_id.length) throw new Error('Not enough params.');
    const list = await this._get({ deleted_at: null, ...params });

    return list.map(li => {
      if (li.targets) li.targets = JSON.parse(li.targets);
      return li;
    }) as GroupItem[];
  }
  async insert(params: {
    group_name: string; // required
    type: string; // required
    creator_id: string; // required
  }): Promise<string> {
    const { group_name, type, creator_id } = params;
    if (!group_name || !type || !creator_id)
      throw new Error('Not enough params.');
    return await this._insert(params);
  }
  async delete(params: { group_id?: string | string[] }): Promise<number> {
    const { group_id } = params;
    if (!group_id || !group_id.length) throw new Error('Not enough params.');
    return await this._update(
      { deleted_at: new Date() },
      { ...params, deleted_at: null },
    );
  }
}

export default new GroupsTable();
