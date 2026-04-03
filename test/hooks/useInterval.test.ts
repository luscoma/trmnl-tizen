import { describe, it, expect, beforeEach, afterEach, jest } from 'bun:test';
import { renderHook } from '@testing-library/react';
import useInterval from '../../src/hooks/useInterval';

describe('useInterval', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('calls callback at each interval', () => {
    let count = 0;
    renderHook(() => useInterval(() => { count++; }, 1000));
    jest.advanceTimersByTime(3000);
    expect(count).toBe(3);
  });

  it('does not call callback when delay is null', () => {
    let count = 0;
    renderHook(() => useInterval(() => { count++; }, null));
    jest.advanceTimersByTime(5000);
    expect(count).toBe(0);
  });

  it('clears interval on unmount', () => {
    let count = 0;
    const { unmount } = renderHook(() => useInterval(() => { count++; }, 1000));
    jest.advanceTimersByTime(2000);
    expect(count).toBe(2);
    unmount();
    jest.advanceTimersByTime(3000);
    expect(count).toBe(2);
  });

  it('restarts when delay changes', () => {
    let count = 0;
    const { rerender } = renderHook(
      ({ delay }) => useInterval(() => { count++; }, delay),
      { initialProps: { delay: 1000 as number | null } },
    );
    jest.advanceTimersByTime(2500);
    expect(count).toBe(2);
    count = 0;
    rerender({ delay: 500 });
    jest.advanceTimersByTime(2000);
    expect(count).toBe(4);
  });

  it('uses latest callback ref', () => {
    let value = '';
    const { rerender } = renderHook(
      ({ cb }) => useInterval(cb, 1000),
      { initialProps: { cb: () => { value = 'old'; } } },
    );
    rerender({ cb: () => { value = 'new'; } });
    jest.advanceTimersByTime(1000);
    expect(value).toBe('new');
  });
});
