// tests/auth.spec.js
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/test-data.js';

test.describe('Authentication Flow', () => {
  
  test('should render login page with Terrain logo and input fields', async ({ page }) => {
    await page.goto('/');
    
    // Check for Terrain logo
    await expect(page.locator('img[alt*="Terrain Logo"]')).toBeVisible();
    
    // Check for email input
    await expect(page.locator('input[placeholder*="EMAIL"]')).toBeVisible();
    
    // Check for password input
    await expect(page.locator('input[placeholder*="PASSWORD"]')).toBeVisible();
    
    // Check for ENTER button
    await expect(page.locator('button:has-text("ENTER")')).toBeVisible();
  });

  test('should login as regular user and redirect to /booking', async ({ page }) => {
    await page.goto('/');
    
    // Fill in user credentials
    await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.regularUser.email);
    await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.regularUser.password);
    
    // Click login
    await page.click('button:has-text("ENTER")');
    
    // Should redirect to booking page
    await page.waitForURL('**/booking', { timeout: 10000 });
    await expect(page).toHaveURL(/\/booking/);
    
    // Should see logout button
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should login as admin and redirect to /admin', async ({ page }) => {
    await page.goto('/');
    
    // Fill in admin credentials
    await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.admin.email);
    await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.admin.password);
    
    // Click login
    await page.click('button:has-text("ENTER")');
    
    // Should redirect to admin page
    await page.waitForURL('**/admin', { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Enter wrong credentials
    await page.fill('input[placeholder*="EMAIL"]', 'wrong@example.com');
    await page.fill('input[placeholder*="PASSWORD"]', 'wrongpassword');
    
    // Click login
    await page.click('button:has-text("ENTER")');
    
    // Should stay on login page
    await expect(page).toHaveURL('/login', { timeout: 5000 });
    
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/');
    await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.regularUser.email);
    await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.regularUser.password);
    await page.click('button:has-text("ENTER")');
    await page.waitForURL('**/booking');
    
    // Then logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect back to login page
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
    
    // Should see login form again
    await expect(page.locator('input[placeholder*="EMAIL"]')).toBeVisible();
  });
});