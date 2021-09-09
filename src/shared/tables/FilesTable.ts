import { AbstractTable } from './AbstractTable';

export type FileItem = {
  file_id: string;
  name:string;
  size:number;
  type: string;
  gs_name:string;
  url: string;
  face_detected: number;
};

class FilesTable extends AbstractTable {
  table_name = 'files';
  id_fields = ['file_id', 'account_id', 'selector_id'];
  async get(params: { 
    file_id?: string | string[],
    selector_id?: string|string[],
    // deleted_at_v2?:number|[v1:number, v2:number]
    deleted_at_v2?:number|number[]
  }) {
    const { file_id, selector_id } = params;
    if (
      (!file_id || (Array.isArray(file_id) && file_id.length === 0))
      && (!selector_id || (Array.isArray(selector_id) && selector_id.length === 0))
    ) {
      throw new Error('Not enough params.');
    }    
    return (await this._get({deleted_at_v2:0, ...params})) as FileItem[];
  }
  async insert(params: {
    account_id?: string;
    url?: string;
    name?: string;
    size?: number;
    type?: string;
    selector_id?:string;
    gs_name?:string;
  }): Promise<string> {
    return await this._insert(params);
  }
  async update(
    params: { name?:string, type?:string, size?:number, gs_name?:string, url?:string, face_detected?: null|number },
    conditions: { file_id?: string },
  ): Promise<number> {
    const { file_id } = conditions;
    if (!file_id) throw new Error('Not enough params.');
    return await this._update(params, conditions);
  }

  async delete(params: {
    file_id?: string|string[];
    selector_id?: string|string[];
    account_id?: string;
  }): Promise<number> {
    const { file_id, account_id, selector_id } = params;
    if (
      (!file_id || (Array.isArray(file_id) && file_id.length === 0))
      && (!selector_id || (Array.isArray(selector_id) && selector_id.length === 0))
      && !account_id
    ) {
      throw new Error('Not enough params.');
    }

    return await this._update({deleted_at_v2:Date.now()/1000}, {...params, deleted_at_v2:0});
  }
}

export default new FilesTable();
