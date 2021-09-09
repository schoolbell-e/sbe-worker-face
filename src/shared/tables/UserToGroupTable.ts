import { AbstractTable } from './AbstractTable';

export type UserToGroupItem = {
  user_id: string;
  group_id: string;
};

class UserToGroupTable extends AbstractTable {
  table_name = 'user_to_group';
  id_fields = ['utg_id', 'user_id'];
  columns_to_pad_for_compatibility = ['group_id'];
  async get(params: { utg_id?: string; user_id?: string; group_id?: string }) {
    const { utg_id, user_id, group_id } = params;
    if (!utg_id && !user_id && !group_id) throw new Error('Not enough params.');
    return (await this._get(params)) as UserToGroupItem[];
  }
  async insert(params: { user_id: string; group_id: string }): Promise<string> {
    const { user_id, group_id } = params;
    if (!user_id || !group_id) throw new Error('Not enough params.');
    return await this._insert(params);
  }
  async delete(params: {
    utg_id?: string;
    user_id?: string;
    group_id?: string;
  }): Promise<number> {
    const { utg_id, user_id } = params;
    if (!utg_id && !user_id) throw new Error('Not enough params.');
    return await this._delete(params);
  }
}

export default new UserToGroupTable();
