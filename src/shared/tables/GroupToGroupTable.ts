import { AbstractTable } from './AbstractTable';

export type GroupToGroupItem = {
  gtg_id: string;
  parent_id: string;
  child_id: string;
};

class GroupToGroupTable extends AbstractTable {
  table_name = 'group_to_group';
  id_fields = ['gtg_id', 'parent_id', 'child_id'];

  async get(params: {
    gtg_id?: string | string[];
    parent_id?: string;
    child_id?: string;
  }) {
    const { gtg_id, parent_id, child_id } = params;
    if (
      (!gtg_id || (Array.isArray(gtg_id) && gtg_id.length === 0)) &&
      !parent_id &&
      !child_id
    )
      throw new Error('Not enough params.');
    return (await this._get({
      deleted_at: null,
      ...params,
    })) as GroupToGroupItem[];
  }
  async insert(params: {
    parent_id: string; // required
    child_id: string; // required
  }): Promise<string> {
    const { parent_id, child_id } = params;
    if (!parent_id || !child_id) throw new Error('Not enough params.');
    return await this._insert(params);
  }
  async delete(params: {
    gtg_id?: string | string[];
    parent_id?: string; // required
    child_id?: string; // required
  }): Promise<number> {
    const { gtg_id, parent_id, child_id } = params;
    if (
      !gtg_id &&
      !(parent_id && (!Array.isArray(parent_id) || parent_id.length)) &&
      !child_id
    )
      throw new Error('Not enough params.');
    return await this._update(
      { deleted_at: new Date(), deleted_at_v2: Date.now() / 1000 },
      { ...params, deleted_at: null },
    );
  }
}

export default new GroupToGroupTable();
