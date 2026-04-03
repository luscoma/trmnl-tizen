// api.ts — TRMNL API layer for Tizen TV app
import { getAppState } from './storage';
import { devBridge } from './devtools';
import type { Resolution } from './storage';

export class HttpError extends Error {
  constructor(public readonly status: number) {
    super('HTTP ' + status);
  }
}

export interface ResolutionDef {
  label: string;
  width: number;
  height: number;
}

interface DisplayResponse {
  image_url: string;
  filename?: string;
  refresh_rate?: number;
}

const HOSTS = {
  production: 'https://usetrmnl.com',
};

export const RESOLUTIONS: Record<Resolution, ResolutionDef> = {
  tv: { label: '1920\u00d71080 (TV)',        width: 1920, height: 1080 },
  og: { label: '800\u00d7480 (TRMNL OG)',    width: 800,  height: 480  },
  x:  { label: '1872\u00d71404 (TRMNL X)',   width: 1872, height: 1404 },
};

export type FetchResult =
  | { unchanged: true;  refreshRate: number }
  | { unchanged: false; dataUrl: string; originalUrl: string; filename: string; refreshRate: number };

// ── TrmnlApi interface ─────────────────────────────────────────────────────────

export interface TrmnlApi {
  fetchImage(
    apiKey: string,
    dims: ResolutionDef,
    currentOriginalUrl: string | null,
    reloadCurrent: boolean,
  ): Promise<FetchResult>;

  triggerSpecialFunction(): Promise<boolean>;
}

// ── Real implementation ────────────────────────────────────────────────────────

let retryCount = 0;
let retryAfterMs: number | null = null;

function recordBackoff(): void {
  retryCount++;
  retryAfterMs = Date.now() + Math.min(1000 * Math.pow(2, retryCount), 300000);
}

function resetBackoff(): void {
  retryCount = 0;
  retryAfterMs = null;
}

function isInBackoff(): boolean {
  return retryAfterMs !== null && Date.now() < retryAfterMs;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const realApi: TrmnlApi = {
  async fetchImage(apiKey, dims, currentOriginalUrl, reloadCurrent) {
    if (isInBackoff()) {
      throw new HttpError(429);
    } else if (devBridge.getForcedResponse()) {
      console.log('trmnl: using forced response', devBridge.getForcedResponse());
      resetBackoff();
      throw new HttpError(devBridge.getForcedResponse()!);
    }

    const headers: Record<string, string> = {
      'access-token':  apiKey,
      'Cache-Control': 'no-cache',
      'Width':         String(dims.width),
      'Height':        String(dims.height),
    };

    const endpoint = reloadCurrent ? '/api/current_screen' : '/api/display';
    console.log('trmnl: fetching image from', endpoint);

    const response = await fetch(HOSTS.production + endpoint, { headers });

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(response.status);
    }

    if (response.status === 429) {
      console.log('trmnl: rate limited');
      recordBackoff();
      throw new HttpError(429);
    }

    if (!response.ok) throw new HttpError(response.status);

    const data: DisplayResponse = await response.json();
    const imageUrl    = data.image_url;
    const filename    = data.filename     ?? 'display.jpg';
    const refreshRate = data.refresh_rate ?? 30;

    if (currentOriginalUrl === imageUrl) {
      console.log('trmnl: image unchanged');
      resetBackoff();
      return { unchanged: true, refreshRate };
    }

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new HttpError(imgResponse.status);

    const blob    = await imgResponse.blob();
    const dataUrl = await blobToDataUrl(blob);

    resetBackoff();
    console.log('trmnl: image fetch complete');
    return { unchanged: false, dataUrl, originalUrl: imageUrl, filename, refreshRate };
  },

  async triggerSpecialFunction() {
    const state = getAppState();
    if (!state.apiKey) return false;

    try {
      const response = await fetch(HOSTS.production + '/api/display', {
        headers: {
          'Access-Token':     state.apiKey,
          'Special-Function': 'true',
          'Cache-Control':    'no-cache',
        },
      });
      return response.ok;
    } catch (e) {
      console.error('trmnl: triggerSpecialFunction error', e);
      return false;
    }
  },
};

// ── Global API + stub helper ───────────────────────────────────────────────────

export let trmnlApi: TrmnlApi = realApi;

export function stubApi(stub: Partial<TrmnlApi>): void {
  trmnlApi = { ...realApi, ...stub };
}

export function resetApi(): void {
  trmnlApi = realApi;
  resetBackoff();
}

// ── Utilities ──────────────────────────────────────────────────────────────────

export function formatTimeRemaining(nextFetch: number | null): string {
  if (!nextFetch) return '--:--';
  const remaining    = Math.max(0, nextFetch - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const hours        = Math.floor(totalSeconds / 3600);
  const minutes      = Math.floor((totalSeconds % 3600) / 60);
  const seconds      = totalSeconds % 60;
  const pad = (n: number) => n < 10 ? '0' + n : String(n);
  if (hours > 0) return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
  return pad(minutes) + ':' + pad(seconds);
}
