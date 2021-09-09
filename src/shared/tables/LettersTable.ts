import { MYSQL } from '@schoolbell-e/backend.servers';
import { AbstractTable, ReservedKeys } from './AbstractTable';
import ScopeHandler from './helpers/ScopeHandler';

export type LetterItem = {
  letter_id: string;
  title: string;
  type: string;
  content: string;
  author_name?: string;
  within: string;
  targets: { group_id: string; scopes: string[] }[];
  selector_id?: string;
  created_at: Date;
  task_id?: string;
};

class LettersTable extends AbstractTable {
  table_name = 'letters';
  id_fields = ['letter_id', 'within', 'selector_id'];
  columns_to_pad_for_compatibility = ['created_by'];

  async get(
    params: {
      letter_id?: string | string[];
      within?: string;
      type?: string;
      selector_id?: string | string[];
      selector_id__not?: null;
      selector_id__like?: string;
      task_id__not?: null;
    } & ReservedKeys,
  ) {
    const { letter_id, within, selector_id } = params;
    if (
      (!letter_id || (Array.isArray(letter_id) && letter_id.length === 0)) &&
      !within &&
      (!selector_id || (Array.isArray(selector_id) && selector_id.length === 0))
    ) {
      throw new Error('Not enough params.');
    }
    const list = await this._get(params);

    return list.map(li => {
      if (li.targets) {
        try {
          li.targets = JSON.parse(li.targets);
          const host = MYSQL.splitDatabaseIdAndValue(li.letter_id)[0];
          li.targets = this.addDatabaseIdToValue(
            host,
            li.targets,
            ['group_id'],
            [],
          );
          li.targets = li.targets.map((target: any) => {
            return {
              ...target,
              scopes: ScopeHandler.migrateScopes(target.scopes),
            };
          });
        } catch (e:any) {}
      }
      return li;
    }) as LetterItem[];
  }
  async insert(params: {
    title: string; // required
    type: string; // required
    created_by?: string;
    within: string; // required
    content?: string;
    targets?: { group_id: string; scopes: string; count?: number }[];
    targets_simplified?: {
      group_id: string;
      scopes: string;
      group_name: string;
      count?: number;
    }[];
    author_name?: string;
    selector_id?: string;
    push_method?: string;
    task_id?: string;
  }): Promise<string> {
    const { title, type, within } = params;
    if (!title || !type || !within) throw new Error('Not enough params.');
    return await this._insert({
      ...params,
      content_without_tags: params.content
        ? params.content.replace(/(<([^>]+)>)/gi, '')
        : null,
      targets: params.targets
        ? JSON.stringify(
            params.targets.map(t => {
              return {
                ...t,
                group_id: MYSQL.splitDatabaseIdAndValue(t.group_id)[1],
              };
            }),
          )
        : null,
      targets_simplified: params.targets_simplified
        ? JSON.stringify(
            params.targets_simplified.map(t => {
              return {
                ...t,
                group_id: MYSQL.splitDatabaseIdAndValue(t.group_id)[1],
              };
            }),
          )
        : null,
    });
  }
  async update(
    params: {
      title?: string;
      content?: string;
      author_name?: string;
      push_method?: string;
      file_cnt?: number;
      task_id?: string;
    },
    conditions: { letter_id: string },
  ): Promise<number> {
    const { letter_id } = conditions;
    if (!letter_id) throw new Error('Not enough params.');
    return await this._update(params, conditions);
  }
  async delete(params: {
    letter_id?: string;
    within?: string;
    selector_id?: string;
  }): Promise<number> {
    const { letter_id, within, selector_id } = params;
    if (!letter_id && !within && !selector_id)
      throw new Error('Not enough params.');
    return await this._delete(params);
  }
}

export default new LettersTable();