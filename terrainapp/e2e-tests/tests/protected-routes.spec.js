// tests/protected-routes.spec.js
import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth.js';
import { TEST_USERS } from '../helpers/test-data.js';

test.describe('Protected Routes', () => {

  test('should show loading state OR redirect unauthenticated users', async ({ page }) => {
    await page.goto('/booking');

    // Accept either a brief "Loading..." state or an immediate redirect to /login.
    const loading = page.getByText(/Loading/i);
    const sawLoading = await loading.isVisible().catch(() => false);

    if (!sawLoading) {
      await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
    }
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/booking');
    await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });

    // Use a11y-friendly selectors if possible; keep your original if needed.
    // await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.locator('input[placeholder*="EMAIL"]')).toBeVisible();
  });

  test('should allow authenticated users to access booking page', async ({ page }) => {
    // Explicit login flow without helper to match your original intent
    await page.goto('/');
    await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.regularUser.email);
    await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.regularUser.password);
    await page.click('button:has-text("ENTER")');

    await page.waitForURL('**/booking', { timeout: 10000 });
    await expect(page).toHaveURL(/\/booking/);
  });

  test('should allow authenticated users to access my-bookings page', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/my-bookings');
    await expect(page).toHaveURL(/\/my-bookings/);

    // Combine different selector engines using locator union (no commas)
    const table = page.locator('table');
    const loading = page.getByText(/Loading/i);
    const emptyMsg = page.getByText(/No bookings/i);

    // Prefer locator.or if your PW version supports it:
    const contentUnion = table.or(loading).or(emptyMsg);
    const visible = await contentUnion.first().isVisible().catch(() => false);
    expect(visible).toBe(true);

  });

  test('authenticated user should maintain session across navigation', async ({ page }) => {
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