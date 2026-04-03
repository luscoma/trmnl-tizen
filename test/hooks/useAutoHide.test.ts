import { describe, it, expect, beforeEach, afterEach, jest } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useAutoHide } from '../../src/hooks/useAutoHide';

describe('useAutoHide', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('starts hidden', () => {
    const { result } = renderHook(() => useAutoHide(4000));
    expect(result.current.visible).toBe(false);
  });

  it('becomes visible after show()', () => {
    const { result } = renderHook(() => useAutoHide(4000));
    act(() => result.current.show());
    expect(result.current.visible).toBe(true);
  });

  it('auto-hides after delay', () => {
    const { result } = renderHook(() => useAutoHide(4000));
    act(() => result.current.show());
    expect(result.current.visible).toBe(true);
    act(() => { jest.advanceTimersByTime(4000); });
    expect(result.current.visible).toBe(false);
  });

  it('resets timer on repeated show()', () => {
    const { result } = renderHook(() => useAutoHide(4000));
    act(() => result.current.show());
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.visible).toBe(true);
    act(() => result.current.show());
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.visible).toBe(true);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.visible).toBe(false);
  });

  it('hide() immediately sets visible to false', () => {
    const { result } = renderHook(() => useAutoHide(4000));
    act(() => result.current.show());
    act(() => result.current.hide());
    expect(result.current.visible).toBe(false);
  });
});
