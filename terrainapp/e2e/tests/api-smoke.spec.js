// terrainapp/e2e/api-smoke.spec.js
import { test, expect, request } from '@playwright/test';

const API_BASE = process.env.API_BASE ?? 'http://localhost:6969/api';

// small helper to time a request
async function timedGet(ctx, url) {
  const t0 = Date.now();
  const res = await ctx.get(url);
  const ms = Date.now() - t0;
  return { res, ms };
}

test.describe.configure({ mode: 'parallel' }); // allow parallel tests

test.describe('API smoke', () => {
  // How many parallel “pings” per endpoint 
  const RUNS = Number(process.env.SMOKE_RUNS ?? 10);
  const MAX_MS = Number(process.env.SMOKE_MAX_MS ?? 300);

  test(`health 200 & fast (x${RUNS})`, async () => {
    const ctx = await request.newContext();
    await Promise.all(
      Array.from({ length: RUNS }, async () => {
        const { res, ms } = await timedGet(ctx, `${API_BASE}/health`);
        expect(res.status(), 'health status').toBe(200);
        expect(ms, `health latency (${ms}ms)`).toBeLessThan(MAX_MS);
      }),
    );
  });

  test(`bookings 200 & fast (x${RUNS})`, async () => {
    const ctx = await request.newContext();
    await Promise.all(
      Array.from({ length: RUNS }, async () => {
        const { res, ms } = await timedGet(ctx, `${API_BASE}/bookings`);
        expect(res.status(), 'bookings status').toBe(200);
        expect(ms, `bookings latency (${ms}ms)`).toBeLessThan(MAX_MS);
      }),
    );
  });
});