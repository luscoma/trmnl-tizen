import { describe, it, expect, beforeEach, afterEach, jest } from 'bun:test';
import { renderHook } from '@testing-library/react';
import useTimeout from '../../src/hooks/useTimeout';

describe('useTimeout', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('calls callback after delay', () => {
    let called = false;
    renderHook(() => useTimeout(() => { called = true; }, 1000));
    expect(called).toBe(false);
    jest.advanceTimersByTime(1000);
    expect(called).toBe(true);
  });

  it('does not call callback when delay is null', () => {
    let called = false;
    renderHook(() => useTimeout(() => { called = true; }, null));
    jest.advanceTimersByTime(10000);
    expect(called).toBe(false);
  });

  it('clears timeout on unmount', () => {
    let called = false;
    const { unmount } = renderHook(() => useTimeout(() => { called = true; }, 1000));
    unmount();
    jest.advanceTimersByTime(2000);
    expect(called).toBe(false);
  });

  it('restarts when delay changes', () => {
    let count = 0;
    const { rerender } = renderHook(
      ({ delay }) => useTimeout(() => { count++; }, delay),
      { initialProps: { delay: 1000 as number | null } },
    );
    jest.advanceTimersByTime(500);
    rerender({ delay: 2000 });
    jest.advanceTimersByTime(1500);
    expect(count).toBe(0);
    jest.advanceTimersByTime(500);
    expect(count).toBe(1);
  });

  it('uses latest callback ref', () => {
    let value = 'old';
    const { rerender } = renderHook(
      ({ cb }) => useTimeout(cb, 1000),
      { initialProps: { cb: () => { value = 'old'; } } },
    );
    rerender({ cb: () => { value = 'new'; } });
    jest.advanceTimersByTime(1000);
    expect(value).toBe('new');
  });
});
