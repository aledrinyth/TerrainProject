// terrainapp/e2e/helpers/auth.js

import { TEST_USERS } from './test-data.js';

export async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.admin.email);
  await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.admin.password);
  await page.click('button:has-text("ENTER")');
  await page.waitForURL('**/admin', { timeout: 10000 });
}

export async function loginAsUser(page) {
  await page.goto('/login');
  await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.regularUser.email);
  await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.regularUser.password);
  await page.click('button:has-text("ENTER")');
  await page.waitForURL('**/booking', { timeout: 10000 });
}

export async function logout(page) {
  await page.click('button:has-text("Logout")');
  await page.waitForURL('/login', { timeout: 5000 });
}