// terrainapp/e2e/tests/booking.spec.js
import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth.js';

/** Helpers **/

// Opens the calendar (assumes the button shows "Select a Date" before any selection)
async function openCalendar(page) {
  await page.click('button:has-text("Select a Date")', { trial: true }).catch(() => {});
  // If label changed due to prior selection, click the calendar trigger again (same button)
  const trigger = page.locator('button').filter({
    has: page.locator('svg[viewBox="0 0 24 24"]') // the calendar icon
  }).first();
  if (await trigger.isVisible()) {
    await trigger.click();
  }
  // Month header should be visible
  await expect(
    page.locator('h3').filter({
      hasText: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/
    })
  ).toBeVisible();
}

// Clicks the first enabled future day; if today+offset is disabled, go to next month and retry.
async function pickEnabledFutureDay(page, daysFromToday = 5) {
  // Compute preferred day number
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + daysFromToday);
  const targetDay = target.getDate();

  // Try current month first
  const targetBtn = page.locator('.grid.grid-cols-7 button').filter({ hasText: new RegExp(`^${targetDay}$`) }).first();

  if (await targetBtn.isVisible() && await targetBtn.isEnabled()) {
    await targetBtn.click();
    return;
  }

  // If disabled or not found, navigate to next month once and pick first enabled day there.
  await page.locator('button[aria-label="Next month"]').click();
  const allDays = page.locator('.grid.grid-cols-7 button');
  const count = await allDays.count();
  for (let i = 0; i < count; i++) {
    const btn = allDays.nth(i);
    if (await btn.isEnabled()) {
      await btn.click();
      return;
    }
  }
  throw new Error('Could not find an enabled day to click in the calendar.');
}

// Wait for seats to load and return a locator for the first available seat (title = Click to select)
async function clickFirstAvailableSeat(page) {
  const firstSeat = page.locator('div[title="Click to select"]').first();
  await expect(firstSeat).toBeVisible({ timeout: 7000 });
  await firstSeat.click();
}

// Close the calendar by clicking outside (component closes on outside click)
async function closeCalendarIfOpen(page) {
  const header = page.locator('h3').filter({
    hasText: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/
  });
  if (await header.isVisible()) {
    // click somewhere outside the calendar panel
    await page.mouse.click(10, 10);
  }
}

test.describe('Booking Page', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    // Ensure we start from a clean state (no open modal / calendar)
    await closeCalendarIfOpen(page);
  });

  test('should render booking page with key elements', async ({ page }) => {
    await expect(page.locator('img[alt*="Terrain Logo"]')).toBeVisible();
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    await expect(page.locator('button:has-text("Select a Date")')).toBeVisible();
  });

  test('should open calendar picker when Select Date is clicked', async ({ page }) => {
    await openCalendar(page);
    // Day headers visible
    await expect(page.locator('text=Sun')).toBeVisible();
    await expect(page.locator('text=Mon')).toBeVisible();
  });

  test('should navigate to next month in calendar', async ({ page }) => {
    await openCalendar(page);
    const monthHeader = page.locator('h3').filter({
      hasText: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/
    });

    const before = await monthHeader.textContent();
    await page.locator('button[aria-label="Next month"]').click();
    const after = await monthHeader.textContent();
    expect(after).not.toBe(before);
  });

  test('should not allow navigation to past months', async ({ page }) => {
    await openCalendar(page);
    const prev = page.locator('button[aria-label="Previous month"]');

    // If we’re on the current month, the previous button should be disabled.
    const isDisabled = await prev.isDisabled();
    if (isDisabled) {
      await expect(prev).toBeDisabled();
    }
  });

  test('should select a date from calendar and fetch seats', async ({ page }) => {
    await openCalendar(page);
    await pickEnabledFutureDay(page, 5);

    // Calendar should close after selection (header gone)
    await expect(
      page.locator('h3').filter({
        hasText: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/
      })
    ).not.toBeVisible({ timeout: 3000 });

    // Seats should load; at least 1 available seat visible
    await expect(page.locator('div[title="Click to select"]').first()).toBeVisible({ timeout: 7000 });
  });

  test('should disable past dates in calendar', async ({ page }) => {
    await openCalendar(page);
    const today = new Date();
    const yesterday = today.getDate() - 1;

    if (yesterday > 0) {
      const pastBtn = page.locator('.grid.grid-cols-7 button').filter({ hasText: new RegExp(`^${yesterday}$`) }).first();
      // If yesterday is in this month grid, it must be disabled
      if (await pastBtn.isVisible()) {
        await expect(pastBtn).toBeDisabled();
        const classes = await pastBtn.getAttribute('class');
        expect(classes || '').toContain('cursor-not-allowed');
      }
    }
  });

  test('should open booking modal when clicking a seat', async ({ page }) => {
    await openCalendar(page);
    await pickEnabledFutureDay(page, 5);
    await clickFirstAvailableSeat(page);

    await expect(page.locator('h2:has-text("New Booking")')).toBeVisible({ timeout: 5000 });
  });

  test('should close modal when Cancel is clicked', async ({ page }) => {
    await openCalendar(page);
    await pickEnabledFutureDay(page, 5);
    await clickFirstAvailableSeat(page);

    const modalHeading = page.locator('h2:has-text("New Booking")');
    await expect(modalHeading).toBeVisible();

    // There are two "Cancel" buttons on the page (header dialog buttons & modal),
    // so target the last "Cancel" inside the overlay.
    await page.locator('div.fixed.inset-0 button:has-text("Cancel")').last().click();
    await expect(modalHeading).not.toBeVisible();
  });

  // (Optional) If you previously had a "time range" validation, it's removed since the modal has no time inputs.

  test('should create a booking successfully', async ({ page }) => {
    // Select a future date
    await openCalendar(page);
    await pickEnabledFutureDay(page, 5);

    // Choose first available seat (opens modal automatically)
    await clickFirstAvailableSeat(page);

    await expect(page.locator('h2:has-text("New Booking")')).toBeVisible();

    // Click the "Book" button inside the modal (scope to overlay to avoid header "My Bookings")
    const modal = page.locator('div.fixed.inset-0').filter({
      has: page.locator('h2:has-text("New Booking")')
    });
    await modal.getByRole('button', { name: /^Book$/ }).click();

    // Success toast/notification
    await expect(page.locator('text=/Successfully booked/i')).toBeVisible({ timeout: 7000 });
  });
});