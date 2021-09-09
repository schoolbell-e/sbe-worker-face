import { AbstractTable } from './AbstractTable';
import ScopeHandler from './helpers/ScopeHandler';

export type FaceReferenceItem = {
  reference_id: string;
  group_id: string;
  scope: string[];
  descriptor: Float32Array;
  img: string;
};

class FaceReferencesTable extends AbstractTable {
  table_name = 'face_references';
  id_fields = ['reference_id', 'group_id'];

  private convertFloat32ArrayToBase64(data: Float32Array): string {
    let base64 = '';
    const encodings =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  
    const bytes = new Uint8Array(data.buffer);
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;
  
    let a, b, c, d;
    let chunk;
  
    // Main loop deals with bytes in chunks of 3
    for (let i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
  
      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
      d = chunk & 63; // 63       = 2^6 - 1
  
      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }
  
    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength];
  
      a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
  
      // Set the 4 least significant bits to zero
      b = (chunk & 3) << 4; // 3   = 2^2 - 1
  
      base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
  
      a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
  
      // Set the 2 least significant bits to zero
      c = (chunk & 15) << 2; // 15    = 2^4 - 1
  
      base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }
  
    return base64;
  }    
  private convertBase64ToFloat32Array(base64: string): Float32Array {
    // const binary = window.atob(base64);
    const binary = Buffer.from(base64, 'base64').toString('binary');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const buffer = bytes.buffer;
    return new Float32Array(buffer);
  }  
  async get(
    params: {
      group_id?: string | string[];
      scope?: string;
      reference_id?: string | string[];
    },
    // convertToFloat32Array = true,
  ) {
    const { group_id, reference_id } = params;
    if (
      (!group_id || (Array.isArray(group_id) && group_id.length === 0)) &&
      (!reference_id ||
        (Array.isArray(reference_id) && reference_id.length === 0))
    )
      throw new Error('Not enough params.');

    let rows = await this._get(params);
    rows = rows.map(row => {
      return { ...row, scope: ScopeHandler.migrateScopes(row.scope), descriptor:this.convertBase64ToFloat32Array(row.descriptor) };
    });
    // if (convertToFloat32Array) {
    //   rows = await Promise.all(
    //     rows.map(row =>
    //       Descriptor.downloadDescriptor(
    //         row.descriptor as string,
    //       ).then(descriptor => ({ ...row, descriptor })),
    //     ),
    //   );
    // }
    return rows as FaceReferenceItem[];
  }
  async insert(params: {
    group_id: string;
    scope: string;
    descriptor: Float32Array;
    // descriptor: string;
    img?: string;
  }): Promise<string> {
    let { group_id, scope, descriptor } = params;
    if (!group_id || !scope || !descriptor)
      throw new Error('Not enough params.');
    // if (descriptor instanceof Float32Array)
    return await this._insert({ ...params, descriptor:this.convertFloat32ArrayToBase64(descriptor) });
  }
  async delete(params: {
    group_id?: string | string[];
    reference_id?: string | string[];
  }): Promise<number> {
    const { group_id, reference_id } = params;
    if (
      (!group_id || (Array.isArray(group_id) && group_id.length === 0)) &&
      (!reference_id ||
        (Array.isArray(reference_id) && reference_id.length === 0))
    )
      throw new Error('Not enough params.');
    const affectedRows = await this._delete(params);
    return affectedRows;
  }
}

export default new FaceReferencesTable();
