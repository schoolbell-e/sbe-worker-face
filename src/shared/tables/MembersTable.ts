import { AbstractTable } from './AbstractTable';
import Members_DesignatedMembersTable from './Members_DesignatedMembersTable';
import Members_ParentsTable from './Members_ParentsTable';
import Members_StudentsTable from './Members_StudentsTable';

export type MemberItem = {
  group_id: string;
  member_type: string;
  member_name: string;
  member_num: number | null;
  member_phone_number: string | null;
  student_member_id: string | null;
  member_user_id: string | null;
  member_utg_id: string | null;
  member_request_status: number;
  scopes: string[];
};

class MembersTable extends AbstractTable {
  table_name = 'group_members';
  id_fields = ['member_id', 'group_id'];
  async get(params: {
    member_id?: string | string[];
    group_id?: string | string[];
    member_type?: string;
  }) {
    const { member_id, group_id } = params;
    if ((!member_id || !member_id.length) && (!group_id || !group_id.length))
      throw new Error('Not enough params.');
    let list = await this._get({ deleted_at_v2: 0, ...params });

    // old compatibility.start
    switch (params.member_type) {
      case 'faceadmin':
      case 'admin':
      case 'faculty':
        list = list.concat(await Members_DesignatedMembersTable.get(params));
        break;
      case 'student':
        list = list.concat(await Members_StudentsTable.get(params));
        break;
      case 'parent':
        list = list.concat(await Members_ParentsTable.get(params));
        break;
      default:
        list = list.concat(await Members_DesignatedMembersTable.get(params));
        list = list.concat(await Members_StudentsTable.get(params));
        list = list.concat(await Members_ParentsTable.get(params));
    }
    // old compatibility.end

    return list.map((li: any) => {
      return { ...li, scopes: this.getScopes(li) };
    }) as MemberItem[];
  }
  /**
   *
   * @param params
   * group_id-member_type-member_name-deleted_at_v2
   */
  async insert(params: {
    group_id: string; // required
    member_type: string; // required
    member_name?: string;
    member_num?: number;
    member_phone_number?: string;
    student_member_id?: string;
    member_user_id?: string;
    member_utg_id?: string;
    member_request_status?: number;
  }): Promise<string> {
    const { group_id, member_type } = params;
    if (!group_id || !member_type) throw new Error('Not enough params.');
    return await this._insert(params);
  }
  async delete(params: {
    member_id?: string | string[];
    group_id?: string;
  }): Promise<number> {
    const { member_id, group_id } = params;
    if ((!member_id || !member_id.length) && !group_id)
      throw new Error('Not enough params.');
    return await this._update(
      { deleted_at_v2: Date.now() / 1000 },
      { ...params, deleted_at_v2: 0 },
    );
  }

  getScopes(member: { member_type: string; member_name?: string }) {
    const scopes = [member.member_type];
    if (member.member_name)
      scopes.push(
        `${member.member_type}_${encodeURIComponent(member.member_name)}`,
      );
    return scopes;
  }
}

export default new MembersTable();
