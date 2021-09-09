import faceapi from 'face-api.js';

import { canvas, faceDetectionNet } from './commons';

const WEIGHTS_DIR = __dirname + '/../../../assets/weights';
export const MAX_DISTANCE = 0.532;
// export const MAX_DISTANCE = 0.4
export const MIN_CONFIDENCE = 0.7;

class Face {
  async detect(src: string) {
    await faceDetectionNet.loadFromDisk(WEIGHTS_DIR);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(WEIGHTS_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(WEIGHTS_DIR);
    const img = await canvas.loadImage(src);
    const detections = await faceapi
      .detectAllFaces(
        img,
        new faceapi.SsdMobilenetv1Options({ minConfidence: MIN_CONFIDENCE }),
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections.map(detection => {
      const { width, height } = detection.detection.imageDims;
      const { left, right, top, bottom } = detection.detection.box;
      return {
        descriptor: detection.descriptor,
        box: {
          left: `${(100 * left) / width}%`, // left px from 0.0 to left percent
          top: `${(100 * top) / height}%`,
          width: `${(100 * (right - left)) / width}%`,
          height: `${(100 * (bottom - top)) / height}%`,
        },

        score: detection.detection.score,
      };
    });
  }
  /**
   *
   * @param reference_faces
   * @param faces_to_match
   * @returns
   */
  async match(reference_faces: Float32Array[], faces_to_match: Float32Array[]) {
    await faceapi.nets.faceRecognitionNet.loadFromDisk(WEIGHTS_DIR);

    const faceMatcher = new faceapi.FaceMatcher(reference_faces);
    const labels = faceMatcher.labeledDescriptors.map(d => d.label);

    const matched_faces = faces_to_match.map(face_to_match => {
      const bestMatch = faceMatcher.findBestMatch(face_to_match);
      const reference_faces_index = labels.indexOf(bestMatch.label);
      return {
        index: reference_faces_index,
        distance: reference_faces_index !== -1 ? bestMatch.distance : null,
      };
    });

    // map to reference_faces's 'point of view
    const matched_faces_from_reference_faces_point_of_view = reference_faces.map(
      (face, i) => {
        let matched_faces_index = matched_faces.findIndex(m => m.index === i);
        let matched_face: any = matched_faces[matched_faces_index];

        // filter too far distance match.
        if (
          matched_face &&
          typeof matched_face.distance === 'number' &&
          matched_face.distance > MAX_DISTANCE
        ) {
          matched_faces_index = -1;
          matched_face = undefined;
        }

        return {
          index: matched_faces_index,
          distance: matched_face ? (matched_face.distance as number) : null,
        };
      },
    );
    return matched_faces_from_reference_faces_point_of_view;
  }
}

export default new Face();
