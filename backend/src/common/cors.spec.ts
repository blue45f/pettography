import { resolveCorsOrigins } from './cors';

describe('resolveCorsOrigins', () => {
  it('falls back to the Vite dev origin when unset', () => {
    expect(resolveCorsOrigins(undefined)).toEqual(['http://localhost:5173']);
  });

  it('falls back to the Vite dev origin for an empty string', () => {
    expect(resolveCorsOrigins('')).toEqual(['http://localhost:5173']);
  });

  it('parses a single configured origin', () => {
    expect(resolveCorsOrigins('https://pettography.vercel.app')).toEqual([
      'https://pettography.vercel.app',
    ]);
  });

  it('parses a comma-separated list and trims whitespace', () => {
    expect(resolveCorsOrigins('https://a.example.com,  https://b.example.com ')).toEqual([
      'https://a.example.com',
      'https://b.example.com',
    ]);
  });

  it('ignores empty entries from trailing or doubled commas', () => {
    expect(resolveCorsOrigins('https://a.example.com,,')).toEqual(['https://a.example.com']);
  });

  it('falls back to the dev origin when the value is only separators', () => {
    expect(resolveCorsOrigins(' , , ')).toEqual(['http://localhost:5173']);
  });
});
