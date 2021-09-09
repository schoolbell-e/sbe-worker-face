import { flatten } from 'lodash';
import FilesTable from '../shared/tables/FilesTable';
import FileToLetterTable from '../shared/tables/FileToLetterTable';
import LettersTable from '../shared/tables/LettersTable';
import LetterToGroupTable from '../shared/tables/LetterToGroupTable';
import MembersTable from '../shared/tables/MembersTable';
import ScopeHandler from '../shared/tables/helpers/ScopeHandler';

class Letter {
  async getFiles(params: { letter_id: string | string[] }) {
    const { letter_id } = params;
    if (!letter_id || !letter_id.length) throw new Error('Not enough params.');
    const ftl_list = await FileToLetterTable.get({ letter_id });
    if (!ftl_list.length) return [];
    return await FilesTable.get({ file_id: ftl_list.map(li => li.file_id) });
  }
  async getTargetMembers(
    params: { letter_id: string },
    from: 'letters' | 'letter_to_group' = 'letters',
  ) {
    const { letter_id } = params;
    let targets: { group_id: string; scopes: string[] }[];
    if (from === 'letter_to_group') {
      targets = await LetterToGroupTable.get({ letter_id, limit: 200 });
    } else {
      const letter = (await LettersTable.get({ letter_id }))[0];
      if (!letter) throw new Error('No letter is found.');
      targets = letter.targets;
    }
    const members = flatten(
      await Promise.all(
        targets.map(target => {
          return MembersTable.get({ group_id: target.group_id }).then(list => {
            return list.filter(member => {
              return (
                ScopeHandler.matchScopes(['all'], target.scopes) ||
                ScopeHandler.matchScopes(member.scopes, target.scopes)
              );
            });
          });
        }),
      ),
    );
    return members;
  }
}

export default new Letter();
