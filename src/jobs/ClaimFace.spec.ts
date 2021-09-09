import Face from '../models/face/Face';
import FaceReferencesTable from '../shared/tables/FaceReferencesTable';
import { ClaimFace } from './ClaimFace';
import { CLOUD_STOREAGE_BUCKET_NAME } from '../shared/util/secrets';
import FaceDetectionsTable from '../shared/tables/FaceDetectionsTable';
import CloudStorage from '../shared/gcp/CloudStorage';
import { Storage } from '@google-cloud/storage';
import { statSync } from 'fs';
import FilesTable from '../shared/tables/FilesTable';
import FaceRecognitionsTable from '../shared/tables/FaceRecognitionsTable';

const group_id = `0:1`;
const scope = 'student_test';
const QUERY_IMAGE = __dirname + '/../../assets/images/bbt4.jpg';

/**
 * npm run test -- src/jobs/ClaimFace.spec.ts
 */
describe('ClaimFace test', () => {
  let face_ids: string[], file_id: string;
  const job = new ClaimFace();

  beforeAll(async () => {
    await FaceRecognitionsTable.truncate();
    await FaceReferencesTable.truncate();
    await FaceDetectionsTable.truncate();
    await FilesTable.truncate();

    // upload file
    const remote = await CloudStorage.upload(
      QUERY_IMAGE,
      CLOUD_STOREAGE_BUCKET_NAME,
    );
    const objectName = remote.replace(
      `gs://${CLOUD_STOREAGE_BUCKET_NAME}/`,
      '',
    );

    // get url
    const storage = new Storage({
      // projectId:'schoolbelle-ci',
      keyFilename:
        __dirname + '/../../secrets/others/google-service-account.json',
    });
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
      name: 'bbt1.4pg',
      size: stats.size,
      type: 'image/jpeg',
      url,
      account_id: `0:g1`, // this is important
    });

    // add new detections
    const faces = await Face.detect(QUERY_IMAGE);
    face_ids = await Promise.all(
      faces.map(face => {
        return FaceDetectionsTable.insert({
          file_id,
          box: face.box,
          score: face.score,
        });
      }),
    );
  });
  it('getDescriptor test', async () => {
    const detections = await Face.detect(QUERY_IMAGE);
    for (const i in detections) {
      const detection = detections[i];
      const out = await job.getFaceDescriptor(QUERY_IMAGE, detection.box);

      expect(out instanceof Float32Array).toBeTruthy();

      const match = (
        await Face.match(
          [out],
          detections.map(d => d.descriptor),
        )
      )[0];
      expect(match.index === Number(i)).toBeTruthy();
    }
  }, 30000);
  it('perform test', async () => {
    const recognition_id1 = await FaceRecognitionsTable.insert({
      file_id,
      face_id: face_ids[0],
      group_id,
      scope,
    });
    var recognition = (
      await FaceRecognitionsTable.get({ recognition_id: recognition_id1 })
    )[0];
    expect(recognition.distance === null).toBeTruthy();
    expect(recognition.reference_id === null).toBeTruthy();
    var references = await FaceReferencesTable.get({ group_id, scope });
    expect(references.length === 0);

    await job.perform({
      face_id: face_ids[0],
      recognition_id: recognition_id1,
    });

    var recognition = (
      await FaceRecognitionsTable.get({ recognition_id: recognition_id1 })
    )[0];
    expect(recognition.distance === 0).toBeTruthy();
    expect(recognition.reference_id !== null).toBeTruthy();
    var references = await FaceReferencesTable.get({ group_id, scope });
    expect(references.length === 1).toBeTruthy();
    expect(recognition.reference_id === references[0].reference_id).toBeTruthy();

    await job.perform({
      face_id: face_ids[0],
      recognition_id: recognition_id1,
    });
    var recognition = (
      await FaceRecognitionsTable.get({ recognition_id: recognition_id1 })
    )[0];
    expect(recognition.distance === 0).toBeTruthy();
    expect(recognition.reference_id !== null).toBeTruthy();
    var references = await FaceReferencesTable.get({ group_id, scope });
    expect(references.length === 1).toBeTruthy();
    expect(recognition.reference_id === references[0].reference_id).toBeTruthy();
  }, 30000);
});
