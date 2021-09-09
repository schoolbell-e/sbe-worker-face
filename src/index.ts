import { ClaimFace } from './jobs/ClaimFace';
import { RecognizeFaces } from './jobs/RecognizeFaces';
import { Worker } from './shared/worker/Worker';
const TOPIC_NAME = 'face-recognition';
const SUBSCRIPTION_NAME = 'face-recognition';

async function run() {
  const worker = new Worker(TOPIC_NAME, SUBSCRIPTION_NAME, {
    RecognizeFaces,
    ClaimFace,
  });
  await worker.run();
  process.exit();
}
run();
