import Face from './Face';

/**
 * npm run test -- src/models/face/Face.spec.ts
 */
describe('Face test', () => {
  const REFERENCE_IMAGE = __dirname + '/../../../assets/images/bbt1.jpg';
  const QUERY_IMAGE = __dirname + '/../../../assets/images/bbt4.jpg';

  let needles: any[], haystacks: any[];

  it('detect()', async () => {
    needles = await Face.detect(QUERY_IMAGE);
    haystacks = await Face.detect(REFERENCE_IMAGE);

    expect(needles.length > 0).toBeTruthy();
    expect(haystacks.length > 0).toBeTruthy();
  });
  it('match()', async () => {
    const result = await Face.match(
      haystacks.map(li => li.descriptor),
      needles.map(li => li.descriptor),
    );
    expect(result.length === haystacks.length).toBeTruthy();
  });
});
