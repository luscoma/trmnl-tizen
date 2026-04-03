// tizen.ts — Tizen platform helpers with simulator fallbacks
//
// In dev builds: pass --define 'SIMULATE_TIZEN=true' to bun build.
// In production builds: leave unset — real Tizen APIs are used.

import CONFIG from './config';

declare const tizen: { application: { getCurrentApplication(): { exit(): void } } };

export interface TizenBridge {
  isSimulatingTizen(): boolean;
  exit(): void;
}

const sim: TizenBridge = {
  isSimulatingTizen() { return true; },
  exit()              { document.dispatchEvent(new CustomEvent('trmnl:sim-exit')); },
};

const prod: TizenBridge = {
  isSimulatingTizen() { return false; },
  exit()              { tizen.application.getCurrentApplication().exit(); },
};

export const tizenBridge: TizenBridge = CONFIG.SIMULATE_TIZEN ? sim : prod;
