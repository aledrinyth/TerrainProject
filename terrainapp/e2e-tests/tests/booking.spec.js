// tests/booking.spec.js
import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth.js';

// helper: find the seat circle by number (avoids clicking calendar days)
const seat = (page, n) =>
  page.locator('div[title="Click to select"]', {
    has: page.locator('span', { hasText: new RegExp(`^${n}$`) })
  });

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('should render booking page with logo, logout, and Select Date button', async ({ page }) => {
    await expect(page.locator('img[alt*="Terrain Logo"]')).toBeVisible();
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    await expect(page.locator('button:has-text("Select Date")')).toBeVisible();
  });

  test('should show date input when Select Date button is clicked', async ({ page }) => {
    await page.click('button:has-text("Select Date")');
    await expect(page.locator('[data-testid="date-input"]')).toBeVisible();
  });

  test('should fetch seat availability when a date is selected', async ({ page }) => {
    await page.click('button:has-text("Select Date")');
    await page.fill('[data-testid="date-input"]', '2026-10-30');

    // Close the date picker so it won't steal clicks
    await page.keyboard.press('Escape');
    await page.mouse.click(10, 10);

    // UI-based wait: seat #1 becomes visible (no brittle network predicate)
    await expect(seat(page, 1)).toBeVisible({ timeout: 10000 });
  });

  test('should open booking modal when clicking a seat', async ({ page }) => {
    await page.click('button:has-text("Select Date")');
    await page.fill('[data-testid="date-input"]', '2026-10-30');

    await page.keyboard.press('Escape');
    await page.mouse.click(10, 10);

    await expect(seat(page, 1)).toBeVisible({ timeout: 10000 });
    await seat(page, 1).click();

    // modal has an <h2>New Booking</h2>
    await expect(page.locator('h2:has-text("New Booking")')).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error when end time is before start time', async ({ page }) => {
    await page.click('button:has-text("Select Date")');
    await page.fill('[data-testid="date-input"]', '2026-10-30');

    await page.keyboard.press('Escape');
    await page.mouse.click(10, 10);

    await expect(seat(page, 1)).toBeVisible({ timeout: 10000 });
    await seat(page, 1).click();

    await expect(page.locator('h2:has-text("New Booking")')).toBeVisible({ timeout: 5000 });

    // Inputs are inside labels → select as descendant
    const startTimeInput = page.locator('label:has-text("Start Time") input').first();
    const endTimeInput   = page.locator('label:has-text("End Time") input').first();

    await startTimeInput.fill('10:00');
    await endTimeInput.fill('09:00');

    // Button text is "Book Seats"
    await page.click('button:has-text("Book Seats")');

    await expect(page.locator('text=/end time must be after start time|invalid time/i')).toBeVisible({ timeout: 5000 });
  });

  test('should close modal when Cancel button is clicked', async ({ page }) => {
    await page.click('button:has-text("Select Date")');
    await page.fill('[data-testid="date-input"]', '2026-10-30');

    await page.keyboard.press('Escape');
    await page.mouse.click(10, 10);

    await expect(seat(page, 1)).toBeVisible({ timeout: 10000 });
    await seat(page, 1).click();

    const modalHeading = page.locator('h2:has-text("New Booking")');
    await expect(modalHeading).toBeVisible();

    await page.click('button:has-text("Cancel")');

    await expect(modalHeading).toBeHidden();
  });

  test('should successfully create a booking', async ({ page }) => {
    await page.click('button:has-text("Select Date")');
    await page.fill('[data-testid="date-input"]', '2026-10-30');

    await page.keyboard.press('Escape');
    await page.mouse.click(10, 10);

    await expect(seat(page, 1)).toBeVisible({ timeout: 10000 });
    await seat(page, 1).click();

    await expect(page.locator('h2:has-text("New Booking")')).toBeVisible({ timeout: 5000 });

    const startTimeInput = page.locator('label:has-text("Start Time") input').first();
    const endTimeInput   = page.locator('label:has-text("End Time") input').first();

    await startTimeInput.fill('09:00');
    await endTimeInput.fill('17:00');

    await page.click('button:has-text("Book Seats")');

    await expect(page.locator('text=/successfully booked|success|booked|confirmed/i')).toBeVisible({ timeout: 15000 });
  });
});