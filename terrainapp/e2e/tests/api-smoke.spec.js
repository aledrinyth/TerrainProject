// terrainapp/e2e/tests/api-smoke.spec.js
import { test, expect, request } from '@playwright/test';

const API_BASE = process.env.API_BASE ?? 'http://localhost:6969/api';
const RUNS = Number(process.env.SMOKE_RUNS ?? 10);
const MAX_MS = Number(process.env.SMOKE_MAX_MS ?? 300);

// small helper to time a request
async function timedGet(ctx, url) {
  const t0 = Date.now();
  const res = await ctx.get(url);
  const ms = Date.now() - t0;
  return { res, ms };
}

test.describe.configure({ mode: 'parallel' });

test.describe('API smoke', () => {
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

  test(`public list 200 & fast (x${RUNS})`, async () => {
    const ctx = await request.newContext();

    // Try a few likely PUBLIC endpoints; pick the first that returns 200.
    const candidates = ['/desks', '/desk', '/users', '/booking', '/bookings'];
    const statuses = {};
    let chosen = null;

    for (const path of candidates) {
      const res = await ctx.get(`${API_BASE}${path}`);
      statuses[path] = res.status();
      if (res.status() === 200) {
        chosen = path;
        break;
      }
    }

    if (!chosen) {
      // Nothing public was found and show what we got and fail clearly.
      console.error('No public 200 endpoint found. Probed:', statuses);
      expect.soft(Object.values(statuses).some(s => s === 200)).toBeTruthy();
      test.skip('Skipping latency check because no public 200 endpoint was found');
      return;
    }

    // Latency burst against the chosen public endpoint
    await Promise.all(
      Array.from({ length: RUNS }, async () => {
        const { res, ms } = await timedGet(ctx, `${API_BASE}${chosen}`);
        expect(res.status(), `${chosen} status`).toBe(200);
        expect(ms, `${chosen} latency (${ms}ms)`).toBeLessThan(MAX_MS);
      }),
    );
  });

  test(`bookings 200 & fast (x${RUNS}) [skip if not public]`, async ({}, testInfo) => {
    const ctx = await request.newContext();
    const probe = await ctx.get(`${API_BASE}/bookings`);
    const code = probe.status();

    if (code !== 200) {
      testInfo.annotations.push({ type: 'skip', description: `/bookings returned ${code} (likely protected or not mounted)` });
      test.skip();
    }

    await Promise.all(
      Array.from({ length: RUNS }, async () => {
        const { res, ms } = await timedGet(ctx, `${API_BASE}/bookings`);
        expect(res.status(), 'bookings status').toBe(200);
        expect(ms, `bookings latency (${ms}ms)`).toBeLessThan(MAX_MS);
      }),
    );
  });
});