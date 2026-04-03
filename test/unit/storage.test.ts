import { describe, it, expect, beforeEach } from 'bun:test';
import { getAppState, appStateReducer } from '../../src/storage';
import type { AppState, StoredImage } from '../../src/storage';

const DEFAULT_STATE: AppState = {
  apiKey: null,
  currentImage: null,
  lastFetch: null,
  nextFetch: null,
  refreshRate: 30,
  resolution: 'tv',
};

const SAMPLE_IMAGE: StoredImage = {
  url: 'data:image/png;base64,abc',
  originalUrl: 'https://example.com/img.png',
  filename: 'test.png',
  timestamp: 1000,
};

describe('getAppState', () => {
  it('returns defaults when localStorage is empty', () => {
    const state = getAppState();
    expect(state).toEqual(DEFAULT_STATE);
  });

  it('reads stored apiKey', () => {
    localStorage.setItem('trmnl_api_key', JSON.stringify('my-key'));
    expect(getAppState().apiKey).toBe('my-key');
  });

  it('reads stored resolution', () => {
    localStorage.setItem('trmnl_resolution', JSON.stringify('og'));
    expect(getAppState().resolution).toBe('og');
  });

  it('reads stored currentImage', () => {
    localStorage.setItem('trmnl_currentImage', JSON.stringify(SAMPLE_IMAGE));
    expect(getAppState().currentImage).toEqual(SAMPLE_IMAGE);
  });

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem('trmnl_api_key', '{not valid json');
    expect(getAppState().apiKey).toBeNull();
  });
});

describe('appStateReducer', () => {
  let state: AppState;
  beforeEach(() => {
    state = { ...DEFAULT_STATE };
  });

  describe('set-api-key', () => {
    it('trims whitespace and updates state', () => {
      const next = appStateReducer(state, { type: 'set-api-key', apiKey: '  abc123  ' });
      expect(next.apiKey).toBe('abc123');
    });

    it('persists to localStorage', () => {
      appStateReducer(state, { type: 'set-api-key', apiKey: 'key1' });
      expect(JSON.parse(localStorage.getItem('trmnl_api_key')!)).toBe('key1');
    });
  });

  describe('set-resolution', () => {
    it('updates resolution in state', () => {
      const next = appStateReducer(state, { type: 'set-resolution', resolution: 'x' });
      expect(next.resolution).toBe('x');
    });

    it('does not affect other state fields', () => {
      state.apiKey = 'key';
      const next = appStateReducer(state, { type: 'set-resolution', resolution: 'og' });
      expect(next.apiKey).toBe('key');
    });

    it('persists to localStorage', () => {
      appStateReducer(state, { type: 'set-resolution', resolution: 'og' });
      expect(JSON.parse(localStorage.getItem('trmnl_resolution')!)).toBe('og');
    });

    it('persists all valid resolutions', () => {
      for (const resolution of ['tv', 'og', 'x'] as const) {
        const next = appStateReducer(state, { type: 'set-resolution', resolution });
        expect(next.resolution).toBe(resolution);
        expect(JSON.parse(localStorage.getItem('trmnl_resolution')!)).toBe(resolution);
      }
    });
  });

  describe('fetch-complete', () => {
    it('stores new image in state and localStorage', () => {
      const next = appStateReducer(state, {
        type: 'fetch-complete',
        currentImage: SAMPLE_IMAGE,
        refreshRate: 60,
        nextFetch: 5000,
      });
      expect(next.currentImage).toEqual(SAMPLE_IMAGE);
      expect(JSON.parse(localStorage.getItem('trmnl_currentImage')!)).toEqual(SAMPLE_IMAGE);
    });

    it('preserves existing image when currentImage is null (unchanged)', () => {
      state.currentImage = SAMPLE_IMAGE;
      const next = appStateReducer(state, {
        type: 'fetch-complete',
        currentImage: null,
        refreshRate: 60,
        nextFetch: 5000,
      });
      expect(next.currentImage).toEqual(SAMPLE_IMAGE);
    });

    it('does not overwrite localStorage image when unchanged', () => {
      localStorage.setItem('trmnl_currentImage', JSON.stringify(SAMPLE_IMAGE));
      state.currentImage = SAMPLE_IMAGE;
      appStateReducer(state, {
        type: 'fetch-complete',
        currentImage: null,
        refreshRate: 60,
        nextFetch: 5000,
      });
      expect(JSON.parse(localStorage.getItem('trmnl_currentImage')!)).toEqual(SAMPLE_IMAGE);
    });

    it('persists refreshRate and nextFetch', () => {
      appStateReducer(state, {
        type: 'fetch-complete',
        currentImage: SAMPLE_IMAGE,
        refreshRate: 120,
        nextFetch: 9999,
      });
      expect(JSON.parse(localStorage.getItem('trmnl_refreshRate')!)).toBe(120);
      expect(JSON.parse(localStorage.getItem('trmnl_nextFetch')!)).toBe(9999);
    });

    it('sets lastFetch to approximately now', () => {
      const before = Date.now();
      const next = appStateReducer(state, {
        type: 'fetch-complete',
        currentImage: null,
        refreshRate: 30,
        nextFetch: 5000,
      });
      const after = Date.now();
      expect(next.lastFetch).toBeGreaterThanOrEqual(before);
      expect(next.lastFetch).toBeLessThanOrEqual(after);
    });
  });

  describe('reset', () => {
    it('clears all localStorage keys', () => {
      localStorage.setItem('trmnl_api_key', '"key"');
      localStorage.setItem('trmnl_resolution', '"og"');
      localStorage.setItem('trmnl_currentImage', '{}');
      localStorage.setItem('trmnl_refreshRate', '60');
      localStorage.setItem('trmnl_nextFetch', '1000');

      appStateReducer(state, { type: 'reset' });

      expect(localStorage.getItem('trmnl_api_key')).toBeNull();
      expect(localStorage.getItem('trmnl_resolution')).toBeNull();
      expect(localStorage.getItem('trmnl_currentImage')).toBeNull();
      expect(localStorage.getItem('trmnl_refreshRate')).toBeNull();
      expect(localStorage.getItem('trmnl_nextFetch')).toBeNull();
    });

    it('returns default state', () => {
      state.apiKey = 'key';
      state.resolution = 'x';
      const next = appStateReducer(state, { type: 'reset' });
      expect(next).toEqual(DEFAULT_STATE);
    });
  });
});
