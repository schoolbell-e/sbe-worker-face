import FilesTable, { FileItem } from '../shared/tables/FilesTable';
import fs from 'fs';
import Face from '../models/Face/Face';
import FaceDetectionsTable from '../shared/tables/FaceDetectionsTable';
import FaceReferencesTable from '../shared/tables/FaceReferencesTable';
import FaceRecognitionsTable from '../shared/tables/FaceRecognitionsTable';
import { AbstractJob } from '../shared/worker/AbstractJob';
import LetterToGroupTable from '../shared/tables/LetterToGroupTable';
import { flatten, groupBy, map } from 'lodash';
import Letter from '../models/Letter';
import PubSub from '../shared/gcp/PubSub';
import FileToLetterTable from '../shared/tables/FileToLetterTable';
import ScopeHandler from '../shared/tables/helpers/ScopeHandler';
import File from '../shared/functions/File';

/**
 *
 * 1. upon file uploaded
 * 2. upon reference image uploaded
 */
export class RecognizeFaces extends AbstractJob {
  async splitBoardIntoLetters(
    group_id: string,
    board_type: string,
    limit = 100,
  ) {
    let letter_ids: string[] = [];
    const ltg_list = await LetterToGroupTable.get({
      group_id,
      board_type,
      limit,
    });
    letter_ids = ltg_list.map(li => li.letter_id);
    return letter_ids;
  }
  async splitLetterToFileIdsAndReferenceIds(
    letter_id: string,
    file_ids: string[] = [],
    rerun = false,
  ) {
    let reference_ids: string[] = [];
    if (!file_ids || !file_ids.length) {
      let files = await Letter.getFiles({ letter_id }).then(list =>
        list.filter(li => (li.type.match('image') ? true : false)),
      );
      if (rerun) files = files.filter(f => f.face_detected === 1);
      file_ids = files.map(f => f.file_id);
    }

    if (!file_ids.length) {
      return [];
    }
    const members = await Letter.getTargetMembers({ letter_id });
    const grouped = groupBy(members, 'group_id');
    const references = flatten(
      await Promise.all(
        map(grouped, (list, group_id) => {
          const scopes = flatten(list.map(li => li.scopes));
          return FaceReferencesTable.get({ group_id }).then(list => {
            return list.filter(li =>
              ScopeHandler.matchScopes(scopes, li.scope),
            );
          });
        }),
      ),
    );

    reference_ids = references.map(r => r.reference_id);

    return file_ids.map(file_id => {
      return { file_id, reference_ids };
    });
  }

  /**
   *
   * @param params
   * file_id and group_id are essential
   */
  async perform(params: {
    group_id?: string | number;
    board_type?: string;
    letter_id?: string | number;
    file_ids?: string[];
    file_id?: string;
    reference_ids?: string[];
    rerun?: boolean;
  }) {
    try {
      let {
        letter_id,
        file_ids,
        group_id,
        board_type,
        file_id,
        reference_ids,
        rerun,
      } = params;

      // compatibilty patch
      if (
        typeof group_id === 'number' ||
        (typeof group_id === 'string' && group_id.match(/^\d+$/))
      )
        group_id = `0:${group_id}`;
      if (
        typeof letter_id === 'number' ||
        (typeof letter_id === 'string' && letter_id.match(/^\d+$/))
      )
        letter_id = `0:${letter_id}`;
      // compatibilty patch

      if ((group_id && board_type) || letter_id) {
        let letter_ids: string[] = [];
        if (group_id && board_type) {
          letter_ids = await this.splitBoardIntoLetters(group_id, board_type);
        } else if (letter_id) {
          letter_ids = [letter_id];
        }

        const pair_list = flatten(
          await Promise.all(
            letter_ids.map(letter_id =>
              this.splitLetterToFileIdsAndReferenceIds(
                letter_id,
                file_ids,
                rerun,
              ),
            ),
          ),
        ).filter(li => li.reference_ids.length > 0);
        await Promise.all(
          pair_list.map(li => {
            return PubSub.publish(
              'face-recognition',
              { ...li, rerun },
              { job: 'RecognizeFaces', throttle: 24 * 60 * 60 * 100 },
            );
          }),
        );
        this.logger.info(`Created ${pair_list.length} sub-jobs`);
        return 0;
      }

      if (!file_id) {
        this.logger.error('Params are missing.');
        return 0;
      }

      // set reference_ids if missing
      if (!reference_ids || !reference_ids.length) {
        const ftl_list = await FileToLetterTable.get({ file_id });
        if (!ftl_list || !ftl_list.length) {
          this.logger.error('Targets cannot be determined.');
          return 0;
        }
        const pairs = await this.splitLetterToFileIdsAndReferenceIds(
          ftl_list[0].letter_id,
        );
        reference_ids = pairs[0].reference_ids;
      }

      if (rerun === true) {
        await FaceDetectionsTable.delete({ file_id });
        await FaceRecognitionsTable.delete({ file_id });
        // await FilesTable.update({face_detected:null}, {file_id});
      }

      return await this.run({ file_id, reference_ids });
    } catch (e) {
      console.error(e);
      this.logger.error((<Error>e).stack || (<Error>e).message);
    }
  }

  async run(params: { file_id: string; reference_ids: string[] }) {
    const { file_id, reference_ids } = params;
    if (!file_id || !reference_ids) throw new Error('Params are missing.');

    // 1. fetch or detect faces from image
    const faces = await this.DetectFaces(file_id);
    if (!faces || !faces.length) {
      return 0;
    }

    // 2. get newly added reference faces
    const alreadyRecognizedReferences = await FaceRecognitionsTable.get({
      file_id,
    });
    const already_recognized_reference_ids = alreadyRecognizedReferences.map(
      r => r.reference_id,
    );
    let references = await FaceReferencesTable.get(
      { reference_id: reference_ids },
    );
    references = references.filter(
      r => !already_recognized_reference_ids.includes(r.reference_id),
    );
    if (!references || !references.length) {
      this.logger.info('No references have been added in this image');
      return 0;
    }
    this.logger.info(`Fetched ${references.length} reference faces to match.`);
    // 3. match faces.
    const results = await this.matchFaces(
      references.map(li => li.descriptor),
      faces.map(li => li.descriptor),
    );
    if (!results || !results.length) {
      this.logger.info('No matches are found');
      return 0;
    }
    this.logger.info(
      `${results.filter(r => r.index !== -1).length} matches are found.`,
    );

    // 4. save matches.
    const recognition_ids = await Promise.all(
      results.map((result, needle_index) => {
        const distance = result.distance || undefined;
        const { reference_id } = references[needle_index];
        const face_id =
          result.index !== -1 ? faces[result.index].face_id : undefined;
        return FaceRecognitionsTable.insert({
          file_id,
          reference_id,
          face_id,
          distance,
        });
      }),
    ).then(recognition_ids => recognition_ids.filter(v => v));

    this.logger.info(`${recognition_ids.length} matches/unmatches are saved.`);
    return 0;
  }

  private async DetectFaces(file_id: string) {
    const file = (await FilesTable.get({ file_id }))[0];
    this.logger.info('File info fetched.');

    if (!file.type.match(/^image\//))
      throw new Error('This file is not an image.');

    // if (!!file.face_detected && !rerun) {
    //     return this.fetchFaces(file_id);
    //   } else {
    return await this.detectFaces(file);
    // }
  }

  // private async fetchFaces (file_id:string) {
  //   const list = await FaceDetectionsTable.get({ file_id }, false);
  //   return list;
  // }
  private async detectFaces(file: FileItem) {
    // 1. download
    const src = await File.download(file.url);
    this.logger.info('File downloaded.');

    // 2. detect faces
    const faces = await this.detect(src);
    fs.unlinkSync(src);
    this.logger.info(`${faces.length} faces are detected.`);

    // 3. save
    const list = await this.save(file.file_id, faces);
    this.logger.info(`${faces.length} Faces are saved.`);

    return list;
  }
  private async detect(src: string) {
    return await Face.detect(src);
  }
  private async save(
    file_id: string,
    faces: {
      descriptor: Float32Array;
      box: { left: string; top: string; width: string; height: string };
      score: number;
    }[],
  ) {
    const list = await Promise.all(
      faces.map(face => {
        return FaceDetectionsTable.insert({
          file_id,
          // descriptor: face.descriptor,
          box: face.box,
          score: face.score,
        }).then(face_id => ({ ...face, file_id, face_id }));
      }),
    );
    await FilesTable.update(
      { face_detected: list.length ? 1 : -1 },
      { file_id },
    );
    return list;
  }

  private async matchFaces(
    refrence_descriptors: Float32Array[],
    face_descriptors: Float32Array[],
  ) {
    return await Face.match(refrence_descriptors, face_descriptors);
  }
}
