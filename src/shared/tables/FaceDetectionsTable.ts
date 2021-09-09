import { AbstractTable } from './AbstractTable';

export type FaceDetectionItem = {
  face_id: string;
  file_id: string;
  box: { left: string; top: string; width: string; height: string };
  score: number;
};
class FaceDetectionsTable extends AbstractTable {
  table_name = 'face_detections';
  id_fields = ['face_id', 'file_id'];
  async get(params: { file_id?: string; face_id?: string }) {
    const { file_id, face_id } = params;
    if (!file_id && !face_id) throw new Error('Not enough params.');
    const rows = await this._get(params);
    rows.forEach(row => (row.box = JSON.parse(row.box)));
    return rows as FaceDetectionItem[];
  }
  async insert(params: {
    file_id: string;
    box: { [key: string]: any };
    score: number;
  }): Promise<string> {
    const { file_id, box } = params;
    if (!file_id || !box) throw new Error('Not enough params.');

    const detection_id = await this._insert({
      ...params,
      box: JSON.stringify(params.box),
    });

    return detection_id;
  }

  async delete(params: {
    file_id?: string | string[];
    face_id?: string;
  }): Promise<number> {
    const { file_id, face_id } = params;
    if (
      (!file_id || (Array.isArray(file_id) && file_id.length === 0)) &&
      !face_id
    ) {
      throw new Error('Not enough params.');
    }
    const affectedRows = await this._delete(params);
    return affectedRows;
  }
}

export default new FaceDetectionsTable();
