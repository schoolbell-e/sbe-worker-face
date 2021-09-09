import { Storage } from '@google-cloud/storage';
import { existsSync } from 'fs';
import { basename } from 'path';
import { CLOUD_STOREAGE_BUCKET_NAME } from '@schoolbell-e/backend.util';

const process_supported_image_extensions = [
  'jpg',
  'jpeg',
  'png', // image extensions
];
const process_supported_video_extensions = [
  'mp4',
  'mov',
  'avi',
  'mkv',
  'wmv',
  'mjpg', // video
];
const process_supported_audio_extensions = [
  'wav', // audio types
];
const process_supported_doc_extensions = [
  // 'hwp', 'pdf', 'xlsx', // doc
  'hwp',
  'pdf',
  'xlsx',
  'xls',
  'pptx',
  'hpt',
  'show', // doc
];
const process_supported_extensions = [
  ...process_supported_image_extensions,
  ...process_supported_video_extensions,
  ...process_supported_audio_extensions,
  ...process_supported_doc_extensions,
];

class CloudStorage {
  storage:Storage;
  constructor() {
    this.storage = new Storage(process.env['GCS_EMULATOR_HOST'] ? {
      apiEndpoint: process.env['GCS_EMULATOR_HOST'],
      projectId: process.env['STORAGE_PROJECT_ID']
    } : undefined);
  }
  async upload(
    local: string,
    remote?: string,
    bucketName: string = CLOUD_STOREAGE_BUCKET_NAME,
  ) {
    const match = remote && remote.match(/^gs:\/\/([^\/]+)\/(.+)$/);
    if (match) {
      remote = match[2];
      bucketName = match[1];
    }

    if (!existsSync(local)) throw new Error(`File ${local} cannot be found.`);

    const storage = this.storage;
    try {
      await storage.bucket(bucketName).upload(local, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        destination: remote,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
          // Enable long-lived HTTP caching headers
          // Use only if the contents of the file will never change
          // (If the contents will change, use cacheControl: 'no-cache')
          cacheControl: 'public, max-age=31536000',
        },
      });
    }
    catch (e:any) {
      console.error(e);
      throw e;
    }

    // console.log(`${local} uploaded to gs://${bucketName}/${destination ? destination : basename(local)}.`);
    return `gs://${bucketName}/${remote ? remote : basename(local)}`;
  }
  async download(
    remote: string,
    destination: string,
    bucketName: string = CLOUD_STOREAGE_BUCKET_NAME,
  ) {
    const match = remote.match(/^gs:\/\/([^\/]+)\/(.+)$/);
    if (match) {
      remote = match[2];
      bucketName = match[1];
    }
    // [START storage_download_file]
    /**
     * TODO(developer): Uncomment the following lines before running the sample.
     */
    // const bucketName = 'Name of a bucket, e.g. my-bucket';
    // const remote = 'Remote file to download, e.g. file.txt';
    // const destination = 'Local destination for file, e.g. ./local/path/to/file.txt';

    // Creates a client
    const storage = this.storage;

    // Downloads the file
    await storage
      .bucket(bucketName)
      .file(remote)
      .download({
        destination,
      });

    // console.log(`gs://${bucketName}/${remote} downloaded to ${destination}.`);
  }
  async delete(
    remote: string,
    bucketName: string = CLOUD_STOREAGE_BUCKET_NAME,
  ) {
    const match = remote.match(/^gs:\/\/([^\/]+)\/(.+)$/);
    if (match) {
      remote = match[2];
      bucketName = match[1];
    }
    if (!remote) throw new Error('Params is missing.');
    // Creates a client
    const storage = this.storage;

    // const object = await storage
    // .bucket(bucketName)
    // .file(remote);

    // if (await object.exists()) {
    //   await object.delete();
    // }
    // else {
    await storage
      .bucket(bucketName)
      .deleteFiles({ prefix: remote, force: true });
    // }
  }
  async exists(
    remote: string,
    bucketName: string = CLOUD_STOREAGE_BUCKET_NAME,
  ) {
    const match = remote.match(/^gs:\/\/([^\/]+)\/(.+)$/);
    if (match) {
      remote = match[2];
      bucketName = match[1];
    }
    // Creates a client
    const storage = this.storage;

    return await storage
      .bucket(bucketName)
      .file(remote)
      .exists()
      .then(list => list[0]);
  }

  buildRemoteUrl(params: {
    file_id: string;
    name: string;
    process?: boolean;
    private?: boolean;
    user_id?: string;
    group_id?: string;
  }) {
    const { file_id, name, process, user_id, group_id } = params;
    let remote = `gs://${CLOUD_STOREAGE_BUCKET_NAME}/`;
    if (params.private) {
      if (group_id) remote += `groups/${group_id}/private`;
      else if (user_id) remote += `users/${user_id}/private`;
      else throw new Error('Params are missing');
    } else {
      const extension = name.split('.').pop();
      if (
        extension &&
        process &&
        process_supported_extensions.includes(extension)
      ) {
        if (process_supported_image_extensions.includes(extension))
          remote += 'images';
        else if (process_supported_video_extensions.includes(extension))
          remote += 'videos';
        else if (process_supported_audio_extensions.includes(extension))
          remote += 'audios';
        else if (process_supported_doc_extensions.includes(extension))
          remote += 'docs';
      } else {
        remote += `${new Date().toISOString().split('T')[0]}`;
      }
      remote += `/${Buffer.from(file_id).toString('base64')}/${name}`;
    }
    return remote;
  }
}

export default new CloudStorage();