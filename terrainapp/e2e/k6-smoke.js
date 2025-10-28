import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],      // <1% failures
    http_req_duration: ['p(95)<300']     // p95 < 300ms
  }
};

const BASE = __ENV.API_BASE || 'http://localhost:6969/api';

export default function () {
  // health
  let res = http.get(`${BASE}/health`);
  check(res, { 'health 200': r => r.status === 200 });

  // list bookings
  res = http.get(`${BASE}/bookings`);
  check(res, { 'list 200': r => r.status === 200 });

  sleep(1);
}