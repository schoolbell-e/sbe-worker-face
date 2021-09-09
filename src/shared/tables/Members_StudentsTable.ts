import { mapKeys } from 'lodash';
import { MYSQL } from '@schoolbell-e/backend.servers';
import { AbstractTable } from './AbstractTable';

class StudentsTable extends AbstractTable {
  table_name = 'students';
  id_fields = ['student_id', 'group_id'];
  columns_to_pad_for_compatibility = ['student_user_id', 'student_utg_id'];
  async get(params: {
    student_id?: string | string[];
    group_id?: string | string[];
  }) {
    const { student_id, group_id } = params;
    if ((!student_id || !student_id.length) && (!group_id || !group_id.length))
      throw new Error('Not enough params.');
    const list = await this._get({ deleted_at_v2: 0, ...params });
    return list.map((li: any) => {
      li = mapKeys(li, (val, key) => key.replace(/^student_/, 'member_'));
      const [host, internal_member_id] = MYSQL.splitDatabaseIdAndValue(
        li.member_id,
      );
      return {
        ...li,
        member_id: `${host}:s.${internal_member_id}`,
        member_type: 'student',
        member_phone_number:
          li.member_countryDialCode && li.member_tel
            ? `+${li.member_countryDialCode}${li.member_tel.slice(1)}`
            : null,
        student_member_id: null,
      };
    });
  }
}

export default new StudentsTable();
