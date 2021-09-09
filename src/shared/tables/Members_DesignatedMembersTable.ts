import { mapKeys } from 'lodash';
import { MYSQL } from '@schoolbell-e/backend.servers';
import { AbstractTable } from './AbstractTable';

class ParentsTable extends AbstractTable {
  table_name = 'designated_members';
  id_fields = ['dm_id', 'group_id'];
  columns_to_pad_for_compatibility = ['dm_user_id', 'dm_utg_id'];
  async get(params: {
    dm_id?: string | string[];
    group_id?: string | string[];
  }) {
    const { dm_id, group_id } = params;
    if ((!dm_id || !dm_id.length) && (!group_id || !group_id.length))
      throw new Error('Not enough params.');
    const list = await this._get({ deleted_at_v2: 0, ...params });

    return list.map((li: any) => {
      li = mapKeys(li, (val, key) => key.replace(/^dm_/, 'member_'));
      const [host, internal_member_id] = MYSQL.splitDatabaseIdAndValue(
        li.member_id,
      );
      return {
        ...li,
        member_id: `${host}:s.${internal_member_id}`,
        member_type: 'dm',
        member_phone_number:
          li.member_countryDialCode && li.member_tel
            ? `+${li.member_countryDialCode}${li.member_tel.slice(1)}`
            : null,
        student_member_id: null,
      };
    });
  }
}
export default new ParentsTable();
