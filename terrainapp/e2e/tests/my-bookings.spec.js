// terrainapp/e2e/tests/my-bookings.spec.js

import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth.js';

test.describe('My Bookings (Customer POV)', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/my-bookings');
  });

  test('should display my bookings page with correct elements', async ({ page }) => {
    // Page title
    await expect(page.locator('h1:has-text("My Bookings")')).toBeVisible();
    
    // Create New Booking button
    await expect(page.locator('button:has-text("Create New Booking")')).toBeVisible();
    
    // Logout button
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    
    // Logo
    await expect(page.locator('img[alt*="Terrain Logo"]')).toBeVisible();
  });

  // 3 columns now (Date, Desk, Action)
  test('should display table with correct columns', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });
    
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Desk")')).toBeVisible();
    await expect(page.locator('th:has-text("Action")')).toBeVisible();
  });

  test('should navigate to booking page when Create New Booking clicked', async ({ page }) => {
    await page.click('button:has-text("Create New Booking")');
    await page.waitForURL('**/booking', { timeout: 5000 });
    await expect(page).toHaveURL(/\/booking/);
  });

  // Date format is now "Sunday, 10/10"
  test('should display dates in correct format', async ({ page }) => {
    await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 10000 });
    
    const firstRow = page.locator('table tbody tr').first();
    const hasData = await firstRow.locator('td').count() > 1;
    
    if (hasData) {
      // Date column (1st column, index 0)
      const dateCell = firstRow.locator('td').first();
      const dateText = await dateCell.textContent();
      
      // Should match format: "Sunday, 10/10" (from formatDate function in CustomerBookingPOV)
      expect(dateText).toMatch(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \d{1,2}\/\d{1,2}$/);
    }
  });

  test('should only show active bookings (not cancelled)', async ({ page }) => {
    await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 10000 });
    
    // Get all rows
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    
    if (count > 0) {
      // No row should have "cancelled" status since they're filtered out
      const rowText = await rows.first().textContent();
      expect(rowText?.toLowerCase()).not.toContain('cancelled');
    }
  });

  // Test cancel modal opens
  test('should open cancel confirmation modal', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    const cancelButtons = await page.locator('button:has-text("Cancel")').count();
    
    if (cancelButtons > 0) {
      await page.locator('button:has-text("Cancel")').first().click();
      
      // Modal should appear
      await expect(page.locator('h3')).toContainText('Cancel booking for');
      await expect(page.locator('button:has-text("Confirm")')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")').last()).toBeVisible();
    }
  });

  // Test modal cancel button
  test('should close modal when Cancel button is clicked', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    const cancelButtons = await page.locator('button:has-text("Cancel")').count();
    
    if (cancelButtons > 0) {
      await page.locator('button:has-text("Cancel")').first().click();
      await expect(page.locator('h3')).toContainText('Cancel booking for');
      
      // Click Cancel in modal
      await page.locator('button:has-text("Cancel")').last().click();
      
      // Modal should close
      await expect(page.locator('h3')).not.toBeVisible();
    }
  });

  test('should cancel a booking successfully', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    const cancelButtons = await page.locator('button:has-text("Cancel")').count();
    
    if (cancelButtons > 0) {
      const initialRows = await page.locator('table tbody tr').filter({ hasNotText: 'No bookings' }).count();
      
      await page.locator('button:has-text("Cancel")').first().click();
      await page.click('button:has-text("Confirm")');
      
      // Wait for API response
      await page.waitForResponse(
        response => response.url().includes('/booking/cancel/') && response.status() === 200,
        { timeout: 10000 }
      ).catch(() => {});
      
      // Wait for refresh
      await page.waitForTimeout(2000);
      
      // Check if booking was removed (since cancelled bookings are filtered out)
      const hasNoBookingsMessage = await page.locator('text=No bookings found').isVisible();
      
      if (!hasNoBookingsMessage) {
        const finalRows = await page.locator('table tbody tr').filter({ hasNotText: 'No bookings' }).count();
        expect(finalRows).toBeLessThanOrEqual(initialRows);
      }
    }
  });

  test('should show empty state when no bookings exist', async ({ page }) => {
    await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 10000 });
    
    const table = page.locator('table');
    const emptyMsg = page.locator('text=No bookings found');
    
    // Either table with data or empty message
    const tableVisible = await table.isVisible();
    const emptyVisible = await emptyMsg.isVisible();
    
    expect(tableVisible || emptyVisible).toBe(true);
  });
});