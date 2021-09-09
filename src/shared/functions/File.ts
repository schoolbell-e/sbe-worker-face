import tmp from 'tmp';
import fs from 'fs';
import fetch from 'node-fetch';
import { pipeline } from 'stream';
import { promisify } from 'util';

class File {
  async download(url: string) {
    const tmpobj = tmp.fileSync();
    const dest = tmpobj.name;

    const response = await fetch(url);
    if (!response.ok || !response.body)
      throw new Error(`unexpected response ${response.statusText}`);
    await promisify(pipeline)(response.body, fs.createWriteStream(dest));
    return dest;
  }
}
export default new File();
