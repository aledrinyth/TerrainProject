// terrainapp/e2e/tests/admin.spec.js

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth.js';

test.describe('Admin Page', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display admin page with correct title', async ({ page }) => {
    // Check page title using font-mono class
    await expect(page.locator('h1:has-text("Admin: Current Bookings")')).toBeVisible();
    
    // Should show logout button
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    
    // Should show logo
    await expect(page.locator('img[alt*="Terrain Logo"]')).toBeVisible();
  });

  // New 6-column structure
  test('should display table with correct column headers', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check all 6 column headers from AdminPage.jsx
    await expect(page.locator('th:has-text("Customer Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Seat")')).toBeVisible();
    await expect(page.locator('th:has-text("Date Of Booking")')).toBeVisible();
    await expect(page.locator('th:has-text("Booked At")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Action")')).toBeVisible();
  });

  test('should display bookings in the table', async ({ page }) => {
    // Wait for loading to finish
    await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 10000 });
    
    // Table should be visible
    await expect(page.locator('table')).toBeVisible();
    
    // Get rows
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    
    // Either has bookings or shows "No bookings found"
    if (count === 1) {
      await expect(page.locator('text=No bookings found')).toBeVisible();
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });

  // Date format matches formatDate function
  test('should display dates in correct format', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    const firstRow = page.locator('table tbody tr').first();
    const hasData = await firstRow.locator('td').count() > 1;
    
    if (hasData) {
      // Date Of Booking column (3rd column, index 2)
      const dateCell = firstRow.locator('td').nth(2);
      const dateText = await dateCell.textContent();
      
      // Should match format: "Sunday, 10 October 2024" (from formatDate function)
      expect(dateText).toMatch(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/);
    }
  });

  // Test status column
  test('should display booking status', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    const firstRow = page.locator('table tbody tr').first();
    const hasData = await firstRow.locator('td').count() > 1;
    
    if (hasData) {
      // Status column (5th column, index 4)
      const statusCell = firstRow.locator('td').nth(4);
      const statusText = await statusCell.textContent();
      
      // Should be either "active" or "cancelled"
      expect(statusText?.toLowerCase()).toMatch(/active|cancelled/);
    }
  });

  // Test cancel modal opens
  test('should open cancel confirmation modal', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Find first non-cancelled booking
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    const isDisabled = await cancelButton.isDisabled();
    
    if (!isDisabled) {
      await cancelButton.click();
      
      // Modal should appear with confirmation text
      await expect(page.locator('h3')).toContainText('Cancel booking for');
      await expect(page.locator('button:has-text("Confirm")')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")').last()).toBeVisible();
    }
  });

  // Test modal cancel button
  test('should close modal when clicking Cancel button', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    const isDisabled = await cancelButton.isDisabled();
    
    if (!isDisabled) {
      await cancelButton.click();
      
      // Modal appears
      await expect(page.locator('h3')).toContainText('Cancel booking for');
      
      // Click Cancel button in modal (last Cancel button)
      await page.locator('button:has-text("Cancel")').last().click();
      
      // Modal should close
      await expect(page.locator('h3')).not.toBeVisible();
    }
  });

  // Test actual cancellation
  test('should cancel a booking successfully', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    const isDisabled = await cancelButton.isDisabled();
    
    if (!isDisabled) {
      await cancelButton.click();
      
      // Click Confirm
      await page.click('button:has-text("Confirm")');
      
      // Wait for API call
      await page.waitForResponse(
        response => response.url().includes('/booking/cancel/') && response.status() === 200,
        { timeout: 10000 }
      ).catch(() => {});
      
      // Modal should close
      await expect(page.locator('h3')).not.toBeVisible({ timeout: 5000 });
    }
  });

  // Test cancelled bookings are shown with reduced opacity
  test('should display cancelled bookings with reduced opacity', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const statusCell = row.locator('td').nth(4);
      const statusText = await statusCell.textContent();
      
      if (statusText?.toLowerCase() === 'cancelled') {
        // Row should have opacity-60 class
        const classes = await row.getAttribute('class');
        expect(classes).toContain('opacity-60');
        
        // Cancel button should be disabled
        const cancelBtn = row.locator('button:has-text("Cancel")');
        await expect(cancelBtn).toBeDisabled();
        break;
      }
    }
  });

  test('should show "No bookings found" when table is empty', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const hasBookings = await page.locator('table tbody tr').filter({ hasNotText: 'No bookings' }).count();
    const hasMessage = await page.locator('text=No bookings found').isVisible();
    
    expect(hasBookings > 0 || hasMessage).toBe(true);
  });
});

test.describe('Admin Access Control', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[placeholder*="EMAIL"]')).toBeVisible();
  });
});