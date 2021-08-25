import { greeter } from './index';

describe('greeter function', () => {
  const name = 'John';
  it('greets a user with `Hello, {name}` message', async() => {
    const p: Promise<string> = greeter(name);
    let hello:string = await p;
    expect(hello).toBe(`Hello, ${name}`);
  });
});
