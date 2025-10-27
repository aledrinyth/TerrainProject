// terrainapp/e2e/tests/protected-routes.spec.js
import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth.js';
import { TEST_USERS } from '../helpers/test-data.js';

const selectDateBtn = () =>
  // tolerate either "Select a Date" or "Select Date"
  'button:has-text("Select a Date"), button:has-text("Select Date")';

test.describe('Protected Routes', () => {

  test('should redirect unauthenticated users from /booking to /login', async ({ page }) => {
    await page.goto('/booking');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
    await expect(page.locator('input[placeholder*="EMAIL"]')).toBeVisible();
  });

  test('should redirect unauthenticated users from /my-bookings to /login', async ({ page }) => {
    await page.goto('/my-bookings');
    await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
    await expect(page.locator('input[placeholder*="EMAIL"]')).toBeVisible();
  });

  test('should redirect unauthenticated users from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
    await expect(page.locator('input[placeholder*="EMAIL"]')).toBeVisible();
  });

  test('should allow authenticated users to access /booking', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.regularUser.email);
    await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.regularUser.password);

    page.on('dialog', async dialog => { try { await dialog.accept(); } catch {} });

    await page.click('button:has-text("ENTER")');
    await page.waitForURL('**/booking', { timeout: 10000 });

    await expect(page).toHaveURL(/\/booking/);
    await expect(page.locator(selectDateBtn())).toBeVisible();
  });

  test('should allow authenticated users to access /my-bookings', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/my-bookings');
    await expect(page).toHaveURL(/\/my-bookings/);
    await expect(page.locator('h1:has-text("My Bookings")')).toBeVisible();
  });

  test('should maintain session across navigation', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/booking');
    await expect(page).toHaveURL(/\/booking/);

    await page.goto('/my-bookings');
    await expect(page).toHaveURL(/\/my-bookings/);

    await page.goto('/booking');
    await expect(page).toHaveURL(/\/booking/);

    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });
});