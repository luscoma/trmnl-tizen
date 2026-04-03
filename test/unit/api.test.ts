import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { devBridge } from '../../src/devtools';
import {
  HttpError,
  trmnlApi,
  resetApi,
  formatTimeRemaining,
  RESOLUTIONS,
} from '../../src/api';

// ── formatTimeRemaining ────────────────────────────────────────────────────────

describe('formatTimeRemaining', () => {
  it('returns "--:--" for null', () => {
    expect(formatTimeRemaining(null)).toBe('--:--');
  });

  it('returns "00:00" for a timestamp in the past', () => {
    expect(formatTimeRemaining(Date.now() - 5000)).toBe('00:00');
  });

  it('formats seconds with padding', () => {
    const result = formatTimeRemaining(Date.now() + 5000);
    expect(result).toBe('00:05');
  });

  it('formats minutes and seconds', () => {
    const result = formatTimeRemaining(Date.now() + 90_000);
    expect(result).toBe('01:30');
  });

  it('includes hours when >= 1 hour', () => {
    const result = formatTimeRemaining(Date.now() + 3723_000); // 1h 2m 3s
    expect(result).toBe('01:02:03');
  });
});

// ── HttpError ──────────────────────────────────────────────────────────────────

describe('HttpError', () => {
  it('stores status', () => {
    const err = new HttpError(404);
    expect(err.status).toBe(404);
  });

  it('has descriptive message', () => {
    expect(new HttpError(500).message).toBe('HTTP 500');
  });

  it('is an instance of Error', () => {
    expect(new HttpError(401)).toBeInstanceOf(Error);
  });
});

// ── globalApi.fetchImage ───────────────────────────────────────────────────────

describe('globalApi.fetchImage', () => {
  const dims = RESOLUTIONS.tv;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    devBridge.setForcedResponse(null);
    resetApi();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetchResponses(apiResponse: Response, imageResponse?: Response) {
    let callCount = 0;
    globalThis.fetch = mock((() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(apiResponse);
      return Promise.resolve(imageResponse ?? new Response('', { status: 200 }));
    }) as typeof fetch);
  }

  function makeApiResponse(overrides: Partial<{ image_url: string; filename: string; refresh_rate: number }> = {}) {
    return new Response(JSON.stringify({
      image_url: 'https://example.com/img.png',
      filename: 'screen.png',
      refresh_rate: 60,
      ...overrides,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  function makeImageResponse() {
    return new Response(new Blob(['fake-image-data'], { type: 'image/png' }), { status: 200 });
  }

  it('calls /api/display when reloadCurrent is false', async () => {
    mockFetchResponses(makeApiResponse(), makeImageResponse());
    await trmnlApi.fetchImage('key', dims, null, false);
    const url = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0][0] as string;
    expect(url).toContain('/api/display');
  });

  it('calls /api/current_screen when reloadCurrent is true', async () => {
    mockFetchResponses(makeApiResponse(), makeImageResponse());
    await trmnlApi.fetchImage('key', dims, null, true);
    const url = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0][0] as string;
    expect(url).toContain('/api/current_screen');
  });

  it('sends correct headers', async () => {
    mockFetchResponses(makeApiResponse(), makeImageResponse());
    await trmnlApi.fetchImage('my-api-key', dims, null, false);
    const headers = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['access-token']).toBe('my-api-key');
    expect(headers['Width']).toBe('1920');
    expect(headers['Height']).toBe('1080');
    expect(headers['Cache-Control']).toBe('no-cache');
  });

  it('throws HttpError(401) on 401 response', async () => {
    mockFetchResponses(new Response('', { status: 401 }));
    await expect(trmnlApi.fetchImage('key', dims, null, false)).rejects.toThrow(expect.objectContaining({ status: 401 }));
  });

  it('throws HttpError(403) on 403 response', async () => {
    mockFetchResponses(new Response('', { status: 403 }));
    await expect(trmnlApi.fetchImage('key', dims, null, false)).rejects.toThrow(expect.objectContaining({ status: 403 }));
  });

  it('throws HttpError(429) on 429 response', async () => {
    mockFetchResponses(new Response('', { status: 429 }));
    await expect(trmnlApi.fetchImage('key', dims, null, false)).rejects.toThrow(expect.objectContaining({ status: 429 }));
  });

  it('throws HttpError on other non-ok response', async () => {
    mockFetchResponses(new Response('', { status: 500 }));
    await expect(trmnlApi.fetchImage('key', dims, null, false)).rejects.toThrow(expect.objectContaining({ status: 500 }));
  });

  it('returns unchanged when currentOriginalUrl matches', async () => {
    mockFetchResponses(makeApiResponse({ image_url: 'https://example.com/same.png' }));
    const result = await trmnlApi.fetchImage('key', dims, 'https://example.com/same.png', false);
    expect(result).toEqual({ unchanged: true, refreshRate: 60 });
  });

  it('returns new image data when URL differs', async () => {
    mockFetchResponses(makeApiResponse({ image_url: 'https://example.com/new.png' }), makeImageResponse());
    const result = await trmnlApi.fetchImage('key', dims, 'https://example.com/old.png', false);
    expect(result.unchanged).toBe(false);
    if (!result.unchanged) {
      expect(result.originalUrl).toBe('https://example.com/new.png');
      expect(result.filename).toBe('screen.png');
      expect(result.refreshRate).toBe(60);
      expect(result.dataUrl).toContain('data:');
    }
  });

  it('uses default filename and refreshRate when not in response', async () => {
    const apiResp = new Response(JSON.stringify({ image_url: 'https://example.com/img.png' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    mockFetchResponses(apiResp, makeImageResponse());
    const result = await trmnlApi.fetchImage('key', dims, null, false);
    if (!result.unchanged) {
      expect(result.filename).toBe('display.jpg');
      expect(result.refreshRate).toBe(30);
    }
  });

  it('throws forced response from devBridge', async () => {
    devBridge.setForcedResponse(429);
    await expect(trmnlApi.fetchImage('key', dims, null, false)).rejects.toThrow(expect.objectContaining({ status: 429 }));
  });
});

// ── globalApi.triggerSpecialFunction ────────────────────────────────────────────

describe('globalApi.triggerSpecialFunction', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns false when no API key', async () => {
    expect(await trmnlApi.triggerSpecialFunction()).toBe(false);
  });

  it('sends Special-Function header', async () => {
    localStorage.setItem('trmnl_api_key', JSON.stringify('test-key'));
    globalThis.fetch = mock((() => Promise.resolve(new Response('', { status: 200 }))) as typeof fetch);
    await trmnlApi.triggerSpecialFunction();
    const headers = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['Special-Function']).toBe('true');
  });

  it('returns false on network error', async () => {
    localStorage.setItem('trmnl_api_key', JSON.stringify('test-key'));
    globalThis.fetch = mock((async () => { throw new Error('network'); }) as typeof fetch);
    expect(await trmnlApi.triggerSpecialFunction()).toBe(false);
  });
});
