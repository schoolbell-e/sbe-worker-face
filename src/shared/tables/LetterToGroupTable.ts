import { flatten } from 'lodash';
import { AbstractTable, ReservedKeys } from './AbstractTable';
import ScopeHandler from './helpers/ScopeHandler';

export type LetterToGroupItem = {
  letter_id: string;
  group_id: string;
  scopes: string[];
};

class LetterToGroupTable extends AbstractTable {
  table_name = 'letter_to_group';
  id_fields = ['ltg_id', 'group_id', 'letter_id'];
  async get(
    params: ReservedKeys & {
      ltg_id?: string;
      group_id?: string;
      board_type?: string;
      letter_id?: string;
      ltg_id__lt?: string;
    },
  ) {
    const { ltg_id, group_id, letter_id } = params;
    if (!ltg_id && !group_id && !letter_id)
      throw new Error('Not enough params.');
    const list = await this._get({ ...params, limit: params.limit || 10 });
    return list.map(li => {
      return { ...li, scopes: ScopeHandler.migrateScopes(li.scopes) };
    }) as LetterToGroupItem[];
  }
  async insert(params: {
    group_id: string;
    letter_id: string;
    board_type: string;
    scopes?: string;
  }): Promise<string> {
    const { group_id, letter_id } = params;
    if (!group_id || !letter_id) throw new Error('Not enough params.');
    return await this._insert(params);
  }
  async delete(params: {
    ltg_id?: string;
    group_id?: string;
    board_type?: string;
    letter_id?: string;
  }): Promise<number> {
    const { ltg_id, group_id, letter_id } = params;
    if (!ltg_id && !group_id && !letter_id)
      throw new Error('Not enough params.');
    return await this._delete(params);
  }
}

export default new LetterToGroupTable();
