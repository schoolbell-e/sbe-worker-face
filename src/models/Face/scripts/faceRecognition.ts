import faceapi from 'face-api.js';

import {
  canvas,
  faceDetectionNet,
  faceDetectionOptions,
  saveFile,
} from '../commons';

const REFERENCE_IMAGE = '../images/bbt1.jpg';
const QUERY_IMAGE = '../images/bbt4.jpg';

async function run() {
  await faceDetectionNet.loadFromDisk('../../weights');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('../../weights');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('../../weights');

  const referenceImage = await canvas.loadImage(REFERENCE_IMAGE);
  const queryImage = await canvas.loadImage(QUERY_IMAGE);

  const resultsRef = await faceapi
    .detectAllFaces(referenceImage, faceDetectionOptions)
    .withFaceLandmarks()
    .withFaceDescriptors();

  const resultsQuery = await faceapi
    .detectAllFaces(queryImage, faceDetectionOptions)
    .withFaceLandmarks()
    .withFaceDescriptors();

  const faceMatcher = new faceapi.FaceMatcher(resultsRef);

  const labels = faceMatcher.labeledDescriptors.map(ld => ld.label);
  const refDrawBoxes = resultsRef
    .map(res => res.detection.box)
    .map((box, i) => new faceapi.draw.DrawBox(box, { label: labels[i] }));
  const outRef = faceapi.createCanvasFromMedia(referenceImage);
  refDrawBoxes.forEach(drawBox => drawBox.draw(outRef));

  saveFile('referenceImage.jpg', (outRef as any).toBuffer('image/jpeg'));

  // save boxes ({left, top, bottom, right}) and descriptors (Float32Array)

  const queryDrawBoxes = resultsQuery.map(res => {
    // const queryDrawBoxes = [resultsQuery[0]].map(res => {
    console.log(
      `res.descriptor.byteLength : ${res.descriptor.byteLength} / ${res.descriptor.length}`,
    );
    const bestMatch = faceMatcher.findBestMatch(res.descriptor);
    const { left, top, bottom, right } = res.detection.box;
    return new faceapi.draw.DrawBox(
      { left, top, bottom, right },
      { label: bestMatch.toString() },
    );
  });
  const outQuery = faceapi.createCanvasFromMedia(queryImage);
  queryDrawBoxes.forEach(drawBox => drawBox.draw(outQuery));
  saveFile('queryImage.jpg', (outQuery as any).toBuffer('image/jpeg'));
  console.log('done, saved results to out/queryImage.jpg');
}

run();
