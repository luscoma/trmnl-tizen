import { test, expect } from '@playwright/test';
import { mockTrmnlApi } from './helpers';

test.beforeEach(async ({ page }) => {
  await mockTrmnlApi(page);
  await page.goto('/');
});

test('shows onboarding screen when no API key', async ({ page }) => {
  await expect(page.getByText('TRMNL')).toBeVisible();
  await expect(page.getByRole('textbox')).toBeVisible();
});

test('input is focused on load', async ({ page }) => {
  const input = page.getByRole('textbox');
  await expect(input).toBeFocused();
});

test('submitting empty key stays on onboarding', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox')).toBeVisible();
});

test('submitting a key transitions to display screen', async ({ page }) => {
  await page.getByRole('textbox').fill('my-test-key');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox')).not.toBeVisible();
  await expect(page.locator('#image-canvas')).toBeVisible();
});

test('Escape triggers sim exit toast', async ({ page }) => {
  await expect(page.getByRole('textbox')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Exit triggered in simulator')).toBeVisible();
});
