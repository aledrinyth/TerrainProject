// terrainapp/e2e/tests/auth.spec.js

import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/test-data.js';
import { logout } from '../helpers/auth.js';

test.describe('Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should render login page with all elements', async ({ page }) => {
    // Check for Terrain logo
    await expect(page.locator('img[alt*="Terrain Logo"]')).toBeVisible();
    
    // Check for email input
    await expect(page.locator('input[placeholder*="EMAIL"]')).toBeVisible();
    
    // Check for password input
    await expect(page.locator('input[placeholder*="PASSWORD"]')).toBeVisible();
    
    // Check for ENTER button
    await expect(page.locator('button:has-text("ENTER")')).toBeVisible();
    
    // Check for FORGOT PASSWORD link
    await expect(page.locator('button:has-text("FORGOT PASSWORD?")')).toBeVisible();
  });

  test('should login as regular user and redirect to /booking', async ({ page }) => {
    await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.regularUser.email);
    await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.regularUser.password);
    
    // Handle the alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Login successful');
      await dialog.accept();
    });
    
    await page.click('button:has-text("ENTER")');
    
    await page.waitForURL('**/booking', { timeout: 10000 });
    await expect(page).toHaveURL(/\/booking/);
    
    // Should see logout button
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should login as admin and redirect to /admin', async ({ page }) => {
    await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.admin.email);
    await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.admin.password);
    
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Admin');
      await dialog.accept();
    });
    
    await page.click('button:has-text("ENTER")');
    
    await page.waitForURL('**/admin', { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[placeholder*="EMAIL"]', 'wrong@example.com');
    await page.fill('input[placeholder*="PASSWORD"]', 'wrongpassword');
    
    page.on('dialog', async dialog => {
      expect(dialog.message()).toMatch(/Login failed|Invalid email or password/i);
      await dialog.accept();
    });
    
    await page.click('button:has-text("ENTER")');
    
    // Should stay on login page
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL('/login');
  });

  // Forgot password tests
  test('should show error when forgot password clicked without email', async ({ page }) => {
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Please enter your email address');
      await dialog.accept();
    });
    
    await page.click('button:has-text("FORGOT PASSWORD?")');
  });

  test('should send password reset email successfully', async ({ page }) => {
    await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.regularUser.email);
    
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Password reset email sent');
      await dialog.accept();
    });
    
    await page.click('button:has-text("FORGOT PASSWORD?")');
  });

  test('should handle invalid email format in forgot password', async ({ page }) => {
    await page.fill('input[placeholder*="EMAIL"]', 'not-an-email');

    page.on('dialog', async dialog => {
      const msg = dialog.message();
      // Accept either a validation error or the generic success message
      expect(/valid email|invalid|If an account exists/i.test(msg)).toBeTruthy();
      await dialog.accept();
    });

    await page.click('button:has-text("FORGOT PASSWORD?")');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[placeholder*="EMAIL"]', TEST_USERS.regularUser.email);
    await page.fill('input[placeholder*="PASSWORD"]', TEST_USERS.regularUser.password);
    
    page.on('dialog', async dialog => await dialog.accept());
    
    await page.click('button:has-text("ENTER")');
    await page.waitForURL('**/booking');
    
    // Logout
    await logout(page);
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[placeholder*="EMAIL"]')).toBeVisible();
  });
});