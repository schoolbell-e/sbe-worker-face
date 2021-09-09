import { ClaimFace } from '../jobs/ClaimFace';
import { RecognizeFaces } from '../jobs/RecognizeFaces';
import { Worker } from '../shared';
const TOPIC_NAME = 'face-recognition';
const SUBSCRIPTION_NAME = 'face-recognition';

async function run() {
  const worker = new Worker(TOPIC_NAME, SUBSCRIPTION_NAME, {
    ClaimFace,
    RecognizeFaces,
  });
  await worker.run();
  process.exit();
}

run();
