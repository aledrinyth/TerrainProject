// helpers/auth.js
import { TEST_USERS } from './test-data.js';

/**
 * Login as a regular user
 */
export async function loginAsUser(page, email = TEST_USERS.regularUser.email, password = TEST_USERS.regularUser.password) {
  await page.goto('/');
  
  await page.fill('input[placeholder*="EMAIL"]', email);
  await page.fill('input[placeholder*="PASSWORD"]', password);
  
  await page.click('button:has-text("ENTER")');
  
  await page.waitForURL('**/booking', { timeout: 10000 });
}

/**
 * Login as admin
 */
export async function loginAsAdmin(page) {
  await page.goto('/');
  
  await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.admin.email);
  await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.admin.password);
  
  await page.click('button:has-text("ENTER")');
  
  await page.waitForURL('**/admin', { timeout: 10000 });
}

/**
 * Logout
 */
export async function logout(page) {
  await page.click('button:has-text("Logout")');
  await page.waitForURL('/', { timeout: 5000 });
}
