import { haversineKm } from './geo';

describe('haversineKm', () => {
  it('returns 0 for the same point', () => {
    expect(haversineKm(37.5, 127.1, 37.5, 127.1)).toBe(0);
  });

  it('returns a positive distance for two different points', () => {
    const km = haversineKm(37.5, 127.1, 37.52, 127.13);
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(10);
  });

  it('rounds to 2 decimals', () => {
    const km = haversineKm(37.5, 127.1, 37.51, 127.11);
    const decimals = km.toString().split('.')[1] ?? '';
    expect(decimals.length).toBeLessThanOrEqual(2);
  });
});
