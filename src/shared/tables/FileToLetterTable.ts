import { differenceBy, intersectionBy } from 'lodash';
import { AbstractTable } from './AbstractTable';

export type FileToLetterItem = {
  ltf_id: string;
  file_id: string;
  letter_id: string;
  priority: number;
};

class FileToLetterTable extends AbstractTable {
  table_name = 'file_to_letter';
  id_fields = ['ltf_id', 'file_id', 'letter_id'];
  async get(params: {
    ltf_id?: string;
    letter_id?: string | string[];
    file_id?: string | string[];
  }) {
    const { ltf_id, letter_id, file_id } = params;
    if (
      !ltf_id &&
      (!letter_id || (Array.isArray(letter_id) && letter_id.length === 0)) &&
      (!file_id || (Array.isArray(file_id) && file_id.length === 0))
    ) {
      throw new Error('Not enough params.');
    }
    return (await this._get(params)) as FileToLetterItem[];
  }
  async insert(params: {
    file_id: string;
    letter_id: string;
    priority?: number;
  }): Promise<string> {
    const { file_id, letter_id } = params;
    if (!file_id || !letter_id) throw new Error('Not enough params.');
    return await this._insert(params);
  }
  async update(
    params: {
      priority?: number;
    },
    conditions: {
      ltf_id?: string;
      letter_id?: string;
      file_id?: string;
    },
  ): Promise<number> {
    const { ltf_id, letter_id, file_id } = conditions;
    if (!ltf_id && !(letter_id && file_id))
      throw new Error('Not enough params.');
    return await this._update(params, conditions);
  }

  async delete(params: {
    ltf_id?: string;
    letter_id?: string;
    file_id?: string | string[];
  }): Promise<number> {
    const { ltf_id, letter_id, file_id } = params;
    if (
      (!file_id || (Array.isArray(file_id) && file_id.length === 0)) &&
      !letter_id &&
      !ltf_id
    ) {
      throw new Error('Not enough params.');
    }

    return await this._delete(params);
  }

  async changeFileList(params: {
    letter_id: string;
    files: { file_id: string; priority?: number }[];
  }) {
    const { letter_id, files } = params;
    if (!letter_id || !Array.isArray(files))
      throw new Error('Not enough params.');
    const files_n = files.map((li, index) => {
      return {
        ...li,
        priority: typeof li.priority === 'number' ? li.priority : index,
        letter_id,
      };
    });
    const files_o = await this.get({ letter_id });

    const stays: FileToLetterItem[] = [];
    const deletes = differenceBy(files_o, files_n, li => li.file_id);
    const inserts = differenceBy(files_n, files_o, li => li.file_id);
    const updates = intersectionBy(files_n, files_o, li => li.file_id).filter(
      li => {
        return (
          files_o.find(file_o => file_o.file_id === li.file_id)?.priority !==
          li.priority
        );
      },
    );

    const results = await Promise.all([
      Promise.all(
        updates.map(({ priority, letter_id, file_id }) =>
          this.update({ priority }, { letter_id, file_id }),
        ),
      ).then(list => list.length),
      Promise.all(
        inserts.map(({ priority, letter_id, file_id }) =>
          this.insert({ priority, letter_id, file_id }),
        ),
      ).then(list => list.length),
      Promise.all(
        deletes.map(({ letter_id, file_id }) =>
          this.delete({ letter_id, file_id }),
        ),
      ).then(list => list.length),
    ]);

    const [update_cnt, insert_cnt, delete_cnt] = results;
    return {
      update_cnt,
      insert_cnt,
      delete_cnt,
    };
  }
}

export default new FileToLetterTable();
