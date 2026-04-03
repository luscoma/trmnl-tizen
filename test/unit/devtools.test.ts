import { describe, it, expect, beforeEach } from 'bun:test';
import { devBridge } from '../../src/devtools';

describe('devBridge', () => {
  beforeEach(() => {
    devBridge.setForcedResponse(null);
  });

  it('returns null initially', () => {
    expect(devBridge.getForcedResponse()).toBeNull();
  });

  it('stores 429', () => {
    devBridge.setForcedResponse(429);
    expect(devBridge.getForcedResponse()).toBe(429);
  });

  it('stores 500', () => {
    devBridge.setForcedResponse(500);
    expect(devBridge.getForcedResponse()).toBe(500);
  });

  it('clears with null', () => {
    devBridge.setForcedResponse(429);
    devBridge.setForcedResponse(null);
    expect(devBridge.getForcedResponse()).toBeNull();
  });
});
