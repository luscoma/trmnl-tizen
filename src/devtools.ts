// devtools.ts — developer tooling, simulator only
// Only reachable via the dev menu which is gated on isSimulatingTizen().

export interface DevBridge {
  // Forced API response — one-shot, consumed by api.ts via setForcedResponse(null)
  getForcedResponse(): 429 | 500 | null;
  setForcedResponse(code: 429 | 500 | null): void;

  // Future: request log, latency simulation, etc.
}

let forcedResponse: 429 | 500 | null = null;

export const devBridge: DevBridge = {
  getForcedResponse() { return forcedResponse; },
  setForcedResponse(code) { forcedResponse = code; },
};
