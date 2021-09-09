import FilesTable from '../shared/tables/FilesTable';
import { CLOUD_STOREAGE_BUCKET_NAME } from '../shared/util/secrets';
import { RecognizeFaces } from './RecognizeFaces';
import { statSync } from 'fs';
import { Storage } from '@google-cloud/storage';
import Face from '../models/Face/Face';
import FaceReferencesTable from '../shared/tables/FaceReferencesTable';
import FaceRecognitionsTable from '../shared/tables/FaceRecognitionsTable';
import FaceDetectionsTable from '../shared/tables/FaceDetectionsTable';
import LettersTable from '../shared/tables/LettersTable';
import FileToLetterTable from '../shared/tables/FileToLetterTable';
import MembersTable from '../shared/tables/MembersTable';
import LetterToGroupTable from '../shared/tables/LetterToGroupTable';
import { basename } from 'path';

/**
 * npm run test -- src/jobs/RecognizeFaces.spec.ts
 */
describe('RecognizeFaces test', async () => {
  const QUERY_IMAGE = __dirname + '/../../assets/images/bbt4.jpg';
  const REFERENCE_IMAGE = __dirname + '/../../assets/images/bbt1.jpg';
  const user_id = `0:1`;
  const group_id = `0:1`;
  const scope = 'student_test';
  let board_type = 'photo',
    letter_id: string,
    file_id: string,
    reference_ids: string[];
  const job = new RecognizeFaces();

  beforeAll(async () => {
    await FaceRecognitionsTable.truncate();
    await FaceReferencesTable.truncate();
    await FaceDetectionsTable.truncate();
    await FilesTable.truncate();
    await MembersTable.truncate();

    // set reference images
    const faces = await Face.detect(REFERENCE_IMAGE);
    reference_ids = await Promise.all(
      faces.map((face, i) => {
        return FaceReferencesTable.insert({
          group_id,
          scope,
          descriptor: faces[i].descriptor,
        });
      }),
    );

    const storage = new Storage({
      // projectId:'schoolbelle-ci',
      keyFilename:
        __dirname + '/../../secrets/others/google-service-account.json',
    });

    // upload file
    storage.bucket(CLOUD_STOREAGE_BUCKET_NAME)
    .upload(QUERY_IMAGE)

    const remote = `gs://${CLOUD_STOREAGE_BUCKET_NAME}/${basename(QUERY_IMAGE)}`;
    const objectName = remote.replace(
      `gs://${CLOUD_STOREAGE_BUCKET_NAME}/`,
      '',
    );

    // get url
    const [url] = await storage
      .bucket(CLOUD_STOREAGE_BUCKET_NAME)
      .file(objectName)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60, // one hour
      });

    // insert into file table
    const stats = statSync(QUERY_IMAGE);
    file_id = await FilesTable.insert({
      name: 'bbt1.jpg',
      size: stats.size,
      type: 'image/jpeg',
      url,
      account_id: `0:g1`, // this is important
    });

    await MembersTable.insert({
      group_id,
      member_type: scope.split('_')[0],
      member_name: scope.split('_')[1],
    });
    letter_id = await LettersTable.insert({
      title: 'hi',
      type: board_type,
      created_by: user_id,
      within: group_id,
      targets: [{ group_id, scopes: 'all' }],
    });

    // remove old ltg
    await LetterToGroupTable.delete({ group_id });

    // insert a new ltg
    await LetterToGroupTable.insert({
      letter_id,
      group_id,
      board_type: board_type,
      scopes: 'all',
    });

    // remove old ltg
    await FileToLetterTable.delete({ letter_id });
    await FileToLetterTable.insert({ letter_id, file_id });
  });

  it('perform()', async () => {
    var recognitions = await FaceRecognitionsTable.get({ file_id });

    // with specified reference_ids
    let result = await job.perform({
      file_id,
      reference_ids: [reference_ids[0]],
    });

    var recognitions = await FaceRecognitionsTable.get({ file_id });
    expect(recognitions.length === 1).toBeTruthy();
    expect(recognitions.filter(r => r.face_id).length === 1).toBeTruthy();

    // without specified reference_ids
    result = await job.perform({ file_id });
    var recognitions = await FaceRecognitionsTable.get({ file_id });
    expect(recognitions.length === 4).toBeTruthy();
    expect(recognitions.filter(r => r.face_id).length === 3).toBeTruthy();
  }, 60000);

  it('splitLetterToFileIdsAndReferenceIds test', async () => {
    const pairs = await job.splitLetterToFileIdsAndReferenceIds(letter_id);
    expect(pairs.length === 1).toBeTruthy();
    expect(file_id === pairs[0].file_id).toBeTruthy();
    expect(reference_ids.length === pairs[0].reference_ids.length).toBeTruthy();
    expect(reference_ids).not.toEqual(pairs[0].reference_ids);
  });
  it('splitLetterToFileIdsAndReferenceIds test', async () => {
    const letter_ids = await job.splitBoardIntoLetters(group_id, board_type);
    expect(letter_ids.length === 1).toBeTruthy();
    expect(letter_id === letter_ids[0]).toBeTruthy();
  });
});
