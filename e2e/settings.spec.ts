import { test, expect } from '@playwright/test';
import { mockTrmnlApi, seedApiKey } from './helpers';

test.beforeEach(async ({ page }) => {
  await mockTrmnlApi(page);
  await seedApiKey(page);
  await page.goto('/');
  await expect(page.locator('#image-canvas')).toBeVisible();
});

test('pressing i opens settings overlay', async ({ page }) => {
  await page.keyboard.press('i');
  await expect(page.getByText('Settings')).toBeVisible();
});

test('arrow keys navigate the settings menu', async ({ page }) => {
  await page.keyboard.press('i');
  await expect(page.getByText('Settings')).toBeVisible();

  // First item should be focused
  const firstItem = page.locator('[class*="itemFocused"]');
  await expect(firstItem).toBeVisible();

  // Move down and check focus moves
  const firstText = await firstItem.textContent();
  await page.keyboard.press('ArrowDown');
  const newFocused = page.locator('[class*="itemFocused"]');
  const secondText = await newFocused.textContent();
  expect(secondText).not.toBe(firstText);
});

test('pressing i again closes settings', async ({ page }) => {
  await page.keyboard.press('i');
  await expect(page.getByText('Settings')).toBeVisible();
  await page.keyboard.press('i');
  await expect(page.getByText('Settings')).not.toBeVisible();
});

test('selecting a resolution closes settings and returns to display', async ({ page }) => {
  await page.keyboard.press('i');
  await expect(page.getByText('Settings')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Settings')).not.toBeVisible();
  await expect(page.locator('#image-canvas')).toBeVisible();
});

test('Edit API Key opens the edit key overlay', async ({ page }) => {
  await page.keyboard.press('i');
  // Navigate to Edit API Key (4th item, index 3)
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Edit API Key')).toBeVisible();
  await expect(page.getByRole('textbox')).toBeVisible();
});

test('editing API key and saving returns to display', async ({ page }) => {
  await page.keyboard.press('i');
  // Navigate to Edit API Key
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  const input = page.getByRole('textbox');
  await input.fill('new-api-key');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(page.locator('#image-canvas')).toBeVisible();
  await expect(page.getByText('Edit API Key')).not.toBeVisible();
});
