// storage.ts — localStorage helpers for TRMNL Tizen app

export type Resolution = 'tv' | 'og' | 'x';

export interface StoredImage {
  url: string;
  originalUrl: string;
  filename: string;
  timestamp: number;
}

export interface AppState {
  apiKey: string | null;
  currentImage: StoredImage | null;
  lastFetch: number | null;
  nextFetch: number | null;
  refreshRate: number;
  resolution: Resolution;
}

export type AppStateAction =
  | { type: 'set-api-key';        apiKey: string }
  | { type: 'set-resolution';     resolution: Resolution }
  | { type: 'fetch-complete';     currentImage: StoredImage | null; refreshRate: number;  nextFetch: number }
  | { type: 'reset' };

const STORAGE_KEYS = {
  apiKey:       'trmnl_api_key',
  currentImage: 'trmnl_currentImage',
  nextFetch:    'trmnl_nextFetch',
  refreshRate:  'trmnl_refreshRate',
  resolution:   'trmnl_resolution',
};

const DEFAULT_REFRESH_RATE = 30; // seconds

function storageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) as T : defaultValue;
  } catch {
    return defaultValue;
  }
}

function storageSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('trmnl: failed to save ' + key, e);
  }
}

export function getAppState(): AppState {
  return {
    apiKey:       storageGet<string | null>(STORAGE_KEYS.apiKey, null),
    currentImage: storageGet<StoredImage | null>(STORAGE_KEYS.currentImage, null),
    lastFetch:    null,  // lastFetch is ephemeral and never stored
    nextFetch:    storageGet<number | null>(STORAGE_KEYS.nextFetch, null),
    refreshRate:  storageGet<number>(STORAGE_KEYS.refreshRate, DEFAULT_REFRESH_RATE),
    resolution:   storageGet<Resolution>(STORAGE_KEYS.resolution, 'tv'),
  };
}

// Each case writes through to localStorage so that getAppState() always reflects
// current state — used by api.ts (triggerSpecialFunction) and the display hook's
// timer/countdown reads which need the latest value synchronously.
export function appStateReducer(state: AppState, action: AppStateAction): AppState {
  switch (action.type) {
    case 'set-api-key':
      const trimmed = action.apiKey.trim();
      storageSet(STORAGE_KEYS.apiKey, trimmed);
      return { ...state, apiKey: trimmed };

    case 'set-resolution':
      storageSet(STORAGE_KEYS.resolution, action.resolution);
      return { ...state, resolution: action.resolution };

    case 'fetch-complete':
      // Only set if the image is changed
      if (action.currentImage) {  
        storageSet(STORAGE_KEYS.currentImage, action.currentImage);
      }
      storageSet(STORAGE_KEYS.refreshRate,  action.refreshRate);
      storageSet(STORAGE_KEYS.nextFetch,    action.nextFetch);
      return { ...state,
        currentImage: action.currentImage ?? state.currentImage,
        refreshRate:  action.refreshRate,
        lastFetch:    Date.now(),
        nextFetch:    action.nextFetch,
      };

    case 'reset':
      for (const key of Object.keys(STORAGE_KEYS)) {
        localStorage.removeItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]);
      }
      return { apiKey: null, currentImage: null, lastFetch: null, nextFetch: null,
               refreshRate: DEFAULT_REFRESH_RATE, resolution: 'tv' };
  }
}
