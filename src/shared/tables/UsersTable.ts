import { AbstractTable } from './AbstractTable';

export type UserItem = {
  user_id: string;
};

class UsersTable extends AbstractTable {
  table_name = 'users';
  id_fields = ['user_id'];
  async get(params: { user_id?: string | string[] }) {
    const { user_id } = params;
    if (!user_id || !user_id.length) throw new Error('Not enough params.');
    const list = await this._get({ deleted_at: null, ...params });

    return list as UserItem[];
  }
  async insert(params: {
    user_name?: string; // required
    user_phone_number: string;
  }): Promise<string> {
    const { user_phone_number } = params;
    if (!user_phone_number) throw new Error('Not enough params.');
    return await this._insert(params);
  }
  async delete(params: { user_id?: string | string[] }): Promise<number> {
    const { user_id } = params;
    if (!user_id || !user_id.length) throw new Error('Not enough params.');
    return await this._update(
      { deleted_at: new Date() },
      { ...params, deleted_at: null },
    );
  }
}

export default new UsersTable();
