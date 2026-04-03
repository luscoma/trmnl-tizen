import type { Page } from '@playwright/test';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const TEST_API_KEY = 'test-api-key-e2e';
const PLACEHOLDER_URL = 'https://via.placeholder.com/1920x1080.png';

/** Intercept all TRMNL API + image requests with canned responses. */
export async function mockTrmnlApi(page: Page) {
  await page.route('**/api/display', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ image_url: PLACEHOLDER_URL, filename: 'test.png', refresh_rate: 300 }),
    }),
  );
  await page.route('**/api/current_screen', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ image_url: PLACEHOLDER_URL, filename: 'test.png', refresh_rate: 300 }),
    }),
  );
  await page.route('https://via.placeholder.com/**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG }),
  );
}

/** Seed localStorage with an API key so the app skips onboarding. */
export async function seedApiKey(page: Page, key = TEST_API_KEY) {
  await page.addInitScript((k) => {
    localStorage.setItem('trmnl_api_key', JSON.stringify(k));
  }, key);
}

export { TEST_API_KEY };
