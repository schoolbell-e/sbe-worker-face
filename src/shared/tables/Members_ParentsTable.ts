import { mapKeys } from 'lodash';
import { MYSQL } from '@schoolbell-e/backend.servers';
import { AbstractTable } from './AbstractTable';

class ParentsTable extends AbstractTable {
  table_name = 'parents';
  id_fields = ['parent_id', 'group_id', 'student_id'];
  columns_to_pad_for_compatibility = ['parent_user_id', 'parent_utg_id'];
  async get(params: {
    parent_id?: string | string[];
    group_id?: string | string[];
  }) {
    const { parent_id, group_id } = params;
    if ((!parent_id || !parent_id.length) && (!group_id || !group_id.length))
      throw new Error('Not enough params.');
    const list = await this._get({ deleted_at_v2: 0, ...params });

    return list.map((li: any) => {
      li = mapKeys(li, (val, key) => key.replace(/^parent_/, 'member_'));
      const [host, internal_member_id] = MYSQL.splitDatabaseIdAndValue(
        li.member_id,
      );
      return {
        ...li,
        member_id: `${host}:s.${internal_member_id}`,
        member_type: 'parent',
        member_phone_number:
          li.member_countryDialCode && li.member_tel
            ? `+${li.member_countryDialCode}${li.member_tel.slice(1)}`
            : null,
        student_member_id: `${host}:s.${MYSQL.splitDatabaseIdAndValue(
          li.student_id,
        )}`,
      };
    });
  }
}
export default new ParentsTable();
