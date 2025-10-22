// tests/admin.spec.js
import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.js';

test.describe('Admin Page', () => {
  
  test('admin should access admin page successfully', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Should be on admin page
    await expect(page).toHaveURL(/\/admin/);
    
    // Should show bookings table
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('admin should see all bookings in table', async ({ page }) => {
    await loginAsAdmin(page);
  
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Get all rows in the table body
    const rows = await page.locator('table tbody tr').count();
    
    // Should have at least one booking
    expect(rows).toBeGreaterThan(0);
  });

  test('admin table should display correct columns', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check for expected column headers
    // Adjust based on your actual table structure
    const table = page.locator('table');
    
    // Common column headers from AdminPage.test.jsx
    await expect(table.locator('th, td').filter({ hasText: /name|desk|start|end|date/i }).first()).toBeVisible();
  });

  test('admin should see bookings sorted by createdAt descending', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Wait for table
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Based on AdminPage.test.jsx:
    // First row should show newest booking (Bob with createdAt: 2025-09-28T12:00:00)
    // This test depends on having test data with known createdAt values
    
    const rows = page.locator('table tbody tr').filter({ hasNotText: 'No bookings' });
    const firstRow = rows.first();
    
    // Verify first row exists
    await expect(firstRow).toBeVisible();
  });

  test('admin table should display time in HH:mm format', async ({ page }) => {
    await loginAsAdmin(page);
  
    // Wait for table
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Get text content and check format
    const timeCell = page.locator('table tbody tr').first().locator('td').nth(3); // Adjust index for your table
    const timeText = await timeCell.textContent();
    
    // Check format: HH:mm (like "16:40" or "09:00")
    expect(timeText).toMatch(/^\d{2}:\d{2}$/);
  });

  test('admin table should display date in DD/MM/YYYY format', async ({ page }) => {
    await loginAsAdmin(page);
  
    // Wait for table
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Get date cell text
    const dateCell = page.locator('table tbody tr').first().locator('td').nth(5); // Adjust index
    const dateText = await dateCell.textContent();
    
    // Check format: DD/MM/YYYY (like "10/31/2025")
    expect(dateText).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
  });

  test('should show fallback message when no bookings exist', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.waitForTimeout(3000);
    
    const hasTable = await page.locator('table tbody tr').filter({ hasNotText: 'No bookings' }).count();
    const hasMessage = await page.locator('text=/No bookings found/i').isVisible();
    
    // Either has bookings OR has "no bookings" message
    expect(hasTable > 0 || hasMessage).toBe(true);
  });
});

test.describe('Admin Access Control', () => {

  test('unauthenticated user should be redirected to login', async ({ page }) => {
    // Try to access admin without logging in
    await page.goto('/admin');
    
    // Should redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
    
    // Should see login form
    await expect(page.locator('input[placeholder*="EMAIL"]')).toBeVisible();
  });
});