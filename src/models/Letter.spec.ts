import Letter from './Letter';

/**
 * npm run test -- src/shared/tables/Letter.spec.ts
 */
describe('Letter test', async () => {
  const letter_id = `0:1`;

  it('getFiles()', async () => {
    const list = await Letter.getFiles({ letter_id });
    expect(Array.isArray(list)).toBeTruthy();
  });
});
