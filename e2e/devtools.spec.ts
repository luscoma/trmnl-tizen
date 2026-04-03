import { test, expect } from '@playwright/test';
import { mockTrmnlApi, seedApiKey } from './helpers';

test.beforeEach(async ({ page }) => {
  await mockTrmnlApi(page);
  await seedApiKey(page);
  await page.goto('/');
  await expect(page.locator('#image-canvas')).toBeVisible();
});

test('pressing d opens dev tools overlay', async ({ page }) => {
  await page.keyboard.press('d');
  await expect(page.getByText('Developer Tools')).toBeVisible();
});

test('displays build constants section', async ({ page }) => {
  await page.keyboard.press('d');
  await expect(page.getByText('Build Constants')).toBeVisible();
  await expect(page.getByText('SIMULATE_TIZEN')).toBeVisible();
});

test('displays fetch state section', async ({ page }) => {
  await page.keyboard.press('d');
  await expect(page.getByText('Fetch State')).toBeVisible();
  await expect(page.getByText('nextFetch')).toBeVisible();
});

test('pressing d again closes dev tools', async ({ page }) => {
  await page.keyboard.press('d');
  await expect(page.getByText('Developer Tools')).toBeVisible();
  await page.keyboard.press('d');
  await expect(page.getByText('Developer Tools')).not.toBeVisible();
});

test('forcing 429 causes rate limited toast on next fetch', async ({ page }) => {
  await page.keyboard.press('d');
  await expect(page.getByText('Developer Tools')).toBeVisible();

  // Select "Force 429" (first item, already focused)
  await page.keyboard.press('Enter');
  await expect(page.getByText('Developer Tools')).not.toBeVisible();

  // Trigger a fetch
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText(/rate limited/i)).toBeVisible({ timeout: 3000 });
});

test('clearing forced response restores normal fetches', async ({ page }) => {
  // Force 429
  await page.keyboard.press('d');
  await page.keyboard.press('Enter');

  // Re-open and select Clear (3rd item)
  await page.keyboard.press('d');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  // Next fetch should succeed — image visible
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('img[alt="TRMNL Display"]')).toBeVisible({ timeout: 5000 });
});
