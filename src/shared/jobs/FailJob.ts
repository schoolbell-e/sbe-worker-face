import { AbstractJob } from './AbstractJob';

export class FailJob extends AbstractJob {
  async perform(params?: any): Promise<any> {
    throw new Error('Error');
  }
}
