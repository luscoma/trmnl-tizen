import { test, expect } from '@playwright/test';
import { mockTrmnlApi, seedApiKey } from './helpers';

test.beforeEach(async ({ page }) => {
  await mockTrmnlApi(page);
  await seedApiKey(page);
  await page.goto('/');
});

test('loads directly to display screen when API key is set', async ({ page }) => {
  await expect(page.getByRole('textbox')).not.toBeVisible();
  await expect(page.locator('#image-canvas')).toBeVisible();
});

test('fetches and displays an image on load', async ({ page }) => {
  const img = page.locator('img[alt="TRMNL Display"]');
  await expect(img).toBeVisible({ timeout: 5000 });
});

test('pressing Down shows the status bar', async ({ page }) => {
  // Wait for display screen to be ready
  await expect(page.locator('#image-canvas')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByText('Settings').first()).toBeVisible();
});

test('status bar auto-hides after 4 seconds', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await expect(page.getByText('Settings').first()).toBeVisible();
  await page.waitForTimeout(4500);
  // Status bar text should no longer be visible (hidden via CSS)
  const statusBar = page.locator('[class*="statusBar"]');
  await expect(statusBar).not.toBeVisible();
});

test('pressing Right triggers a new image fetch', async ({ page }) => {
  await expect(page.locator('img[alt="TRMNL Display"]')).toBeVisible({ timeout: 5000 });

  let displayCallCount = 0;
  await page.route('**/api/display', route => {
    displayCallCount++;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ image_url: 'https://via.placeholder.com/1920x1080.png', refresh_rate: 300 }),
    });
  });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  expect(displayCallCount).toBeGreaterThan(0);
});

test('pressing OK reloads the current screen', async ({ page }) => {
  await expect(page.locator('img[alt="TRMNL Display"]')).toBeVisible({ timeout: 5000 });

  let currentScreenCallCount = 0;
  await page.route('**/api/current_screen', route => {
    currentScreenCallCount++;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ image_url: 'https://via.placeholder.com/1920x1080.png', refresh_rate: 300 }),
    });
  });

  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  expect(currentScreenCallCount).toBeGreaterThan(0);
});
