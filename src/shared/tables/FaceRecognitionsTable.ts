import { AbstractTable } from './AbstractTable';

export type FaceRecognitionItem = {
  recognition_id: string;
  file_id: string;
  face_id: string;
  user_id: string;
  reference_id: string;
  distance: number;
  group_id?: string;
  scope?: string;
};
class FaceRecognitionsTable extends AbstractTable {
  table_name = 'face_recognitions';
  id_fields = [
    'recognition_id',
    'file_id',
    'face_id',
    'reference_id',
    'group_id',
  ];
  async get(params: {
    recognition_id?: string;
    file_id?: string;
    reference_id?: string;
  }) {
    const { recognition_id, file_id } = params;
    if (!recognition_id && !file_id) throw new Error('Not enough params.');
    return (await this._get(params)) as FaceRecognitionItem[];
  }
  async insert(params: {
    file_id: string;
    reference_id?: string;
    face_id?: string;
    distance?: number;
    group_id?: string;
    scope?: string;
  }): Promise<string> {
    const { file_id } = params;
    if (!file_id) throw new Error('Not enough params.');
    return await this._insert(params);
  }
  async update(
    params: {
      distance?: number;
      reference_id?: string;
      group_id?: string;
      scope?: string;
    },
    conditions: {
      recognition_id: string;
    },
  ): Promise<number> {
    const { recognition_id } = conditions;
    if (!recognition_id) throw new Error('Not enough params.');
    return await this._update(params, conditions);
  }
  async delete(params: {
    recognition_id?: string;
    file_id?: string | string[];
    reference_id?: string;
  }): Promise<number> {
    const { recognition_id, file_id } = params;
    if (
      (!file_id || (Array.isArray(file_id) && file_id.length === 0)) &&
      !recognition_id
    ) {
      throw new Error('Not enough params.');
    }
    return await this._delete(params);
  }
}
export default new FaceRecognitionsTable();
