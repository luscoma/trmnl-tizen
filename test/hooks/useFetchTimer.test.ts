import { describe, it, expect, beforeEach, afterEach, jest, mock as bunMock } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useFetchTimer } from '../../src/hooks/useFetchTimer';

describe('useFetchTimer', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('returns "--:--" when nextFetch is null', () => {
    const onExpire = bunMock(() => {});
    const { result } = renderHook(() => useFetchTimer(null, onExpire));
    expect(result.current).toBe('--:--');
  });

  it('returns formatted countdown when nextFetch is in the future', () => {
    const onExpire = bunMock(() => {});
    const future = Date.now() + 90_000; // 1:30
    const { result } = renderHook(() => useFetchTimer(future, onExpire));
    expect(result.current).toBe('01:30');
  });

  it('calls onExpire when timer reaches zero', () => {
    const onExpire = bunMock(() => {});
    const future = Date.now() + 5000;
    renderHook(() => useFetchTimer(future, onExpire));
    act(() => { jest.advanceTimersByTime(5000); });
    expect(onExpire).toHaveBeenCalled();
  });

  it('updates countdown every second', () => {
    const onExpire = bunMock(() => {});
    const future = Date.now() + 5000;
    const { result } = renderHook(() => useFetchTimer(future, onExpire));
    const initial = result.current;
    act(() => { jest.advanceTimersByTime(1000); });
    const after1s = result.current;
    expect(after1s).not.toBe(initial);
  });

  it('pauses when nextFetch changes to null', () => {
    const onExpire = bunMock(() => {});
    const future = Date.now() + 10_000;
    const { result, rerender } = renderHook(
      ({ nf }) => useFetchTimer(nf, onExpire),
      { initialProps: { nf: future as number | null } },
    );
    expect(result.current).not.toBe('--:--');
    rerender({ nf: null });
    expect(result.current).toBe('--:--');
  });
});
