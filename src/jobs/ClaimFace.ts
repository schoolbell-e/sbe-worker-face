import FaceDetectionsTable from '../shared/tables/FaceDetectionsTable';
import FaceReferencesTable from '../shared/tables/FaceReferencesTable';
import FaceRecognitionsTable from '../shared/tables/FaceRecognitionsTable';
import { AbstractJob } from '../shared/jobs/AbstractJob';
import { isMatch, minBy } from 'lodash';
import Face, { MAX_DISTANCE } from '../models/face/Face';
import FilesTable from '../shared/tables/FilesTable';
import PubSub from '../shared/gcp/PubSub';

/**
 *
 * 1. upon file uploaded
 * 2. upon reference image uploaded
 */
export class ClaimFace extends AbstractJob {
  /**
   *  detection will not hold descriptor
   *
   *
   * @param params
   */
  async perform(params: { face_id: string; recognition_id: string }) {
    let { face_id, recognition_id } = params;
    try {
      if (!face_id || !recognition_id) {
        this.logger.error('Params are missing.');
        return 0;
      }
      if (
        typeof face_id === 'number' ||
        (typeof face_id === 'string' && face_id.match(/^\d+$/))
      )
        face_id = `0:${face_id}`;
      if (
        typeof recognition_id === 'number' ||
        (typeof recognition_id === 'string' && recognition_id.match(/^\d+$/))
      )
        recognition_id = `0:${recognition_id}`;

      const recognition = (
        await FaceRecognitionsTable.get({ recognition_id })
      )[0];
      const detected = (await FaceDetectionsTable.get({ face_id }))[0];
      if (!recognition || !detected) {
        this.logger.error('Cannot find related data.');
        return 0;
      }
      const file = (await FilesTable.get({ file_id: detected.file_id }))[0];
      if (!file) {
        this.logger.error('Cannot find the related file.');
        return 0;
      }

      // extract descriptor
      const descriptor = await this.getFaceDescriptor(file.url, detected.box);
      if (!descriptor) {
        this.logger.error('Cannot extract descriptor.');
        return 0;
      }
      this.logger.info('Descriptor is extracted.');

      // get refereces and find the best match among references
      const references = await FaceReferencesTable.get(
        { group_id: recognition.group_id, scope: recognition.scope },
      );
      this.logger.info('References are fetched.');
      let bestMatch: { index: number; distance: number | null } | undefined;
      if (references.length > 0) {
        const matches = await Face.match(
          references.map(ref => ref.descriptor as Float32Array),
          [descriptor],
        );
        bestMatch = minBy(matches, 'distance');
        this.logger.info('Best matched referece is fetched.');
      }

      let reference_id: string, distance: number;
      // if best match does exist, update recognition item by filling in ref_id and distance
      if (
        bestMatch &&
        bestMatch.distance !== null &&
        0 <= bestMatch.distance &&
        bestMatch.distance < MAX_DISTANCE
      ) {
        reference_id = references[bestMatch.index].reference_id;
        distance = bestMatch.distance;
        this.logger.info('Best matched referece has passed the test.');
      }
      // else add a reference
      else {
        reference_id = await FaceReferencesTable.insert({
          group_id: recognition.group_id as string,
          scope: recognition.scope as string,
          descriptor: descriptor,
        });

        PubSub.publish(
          'face-recognition',
          { group_id: recognition.group_id, board_type: 'photo' },
          { job: 'RecognizeFaces', throttle: 24 * 60 * 60 * 100 },
        );
        this.logger.info('Reference face is added.');
        distance = 0;
      }
      await FaceRecognitionsTable.update(
        { reference_id, distance },
        { recognition_id },
      );
    } catch (e) {
      console.error(e);
      this.logger.error((<Error>e).stack || (<Error>e).message);
    }
  }
  // async cropFace (src:string, box:{left:string, top:string, width:string, height:string}) {
  //   const canvas1 = await canvas.loadImage(src)

  //   const perc_x = box.left;
  //   const perc_y = box.top;
  //   const perc_width = box.width;
  //   const perc_height = box.height;

  //   const x = canvas1.width * Number(perc_x.replace(/[^\d\.]/g, '')) / 100
  //   const y = canvas1.height * Number(perc_y.replace(/[^\d\.]/g, '')) / 100
  //   const width = canvas1.width * Number(perc_width.replace(/[^\d\.]/g, '')) / 100
  //   const height = canvas1.height * Number(perc_height.replace(/[^\d\.]/g, '')) / 100
  //   // create an in-memory canvas
  //   const buffer = canvas.createCanvas(width, height);
  //   const b_ctx = buffer.getContext('2d');
  //   // set its width/height to the required ones
  //   // buffer.width = width;
  //   // buffer.height = height;
  //   // draw the main canvas on our buffer one
  //   // drawImage(source, source_X, source_Y, source_Width, source_Height,
  //   //  dest_X, dest_Y, dest_Width, dest_Height)
  //   b_ctx.drawImage(canvas1, x, y, width, height, 0, 0, buffer.width, buffer.height);

  //   return buffer.toBuffer('image/jpeg') as Buffer;
  // }
  async getFaceDescriptor(
    src: string,
    box: { left: string; top: string; width: string; height: string },
  ): Promise<Float32Array> {
    // const buffer = await this.cropFace(src, box);

    // const tmpobj = tmp.fileSync();
    // const cropped = tmpobj.name;
    // fs.writeFileSync(cropped, buffer);

    const faces = await Face.detect(src);
    const face = faces.find(f => isMatch(f.box, box));

    // tmpobj.removeCallback();

    if (!face) throw new Error('Face not detected');

    return face.descriptor;
  }
}
