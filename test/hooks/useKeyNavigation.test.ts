import { describe, it, expect, mock } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useKeyNavigation, useMenuNavigation } from '../../src/hooks/useKeyNavigation';

function fireKey(keyCode: number) {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { keyCode } as KeyboardEventInit));
  });
}

describe('useKeyNavigation', () => {
  it('calls handler with keyCode on keydown', () => {
    const handler = mock(() => {});
    renderHook(() => useKeyNavigation(handler));
    fireKey(13);
    expect(handler).toHaveBeenCalledWith(13);
  });

  it('removes listener on unmount', () => {
    const handler = mock(() => {});
    const { unmount } = renderHook(() => useKeyNavigation(handler));
    unmount();
    fireKey(13);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('useMenuNavigation', () => {
  it('initializes focusIdx to 0', () => {
    const { result } = renderHook(() => useMenuNavigation(5));
    expect(result.current.focusIdx).toBe(0);
  });

  it('increments focusIdx on ArrowDown (40)', () => {
    const { result } = renderHook(() => useMenuNavigation(5));
    fireKey(40);
    expect(result.current.focusIdx).toBe(1);
    fireKey(40);
    expect(result.current.focusIdx).toBe(2);
  });

  it('decrements focusIdx on ArrowUp (38)', () => {
    const { result } = renderHook(() => useMenuNavigation(5));
    fireKey(40); // go to 1
    fireKey(40); // go to 2
    fireKey(38); // back to 1
    expect(result.current.focusIdx).toBe(1);
  });

  it('clamps focusIdx at 0', () => {
    const { result } = renderHook(() => useMenuNavigation(5));
    fireKey(38);
    expect(result.current.focusIdx).toBe(0);
  });

  it('clamps focusIdx at itemCount - 1', () => {
    const { result } = renderHook(() => useMenuNavigation(3));
    fireKey(40);
    fireKey(40);
    fireKey(40);
    fireKey(40);
    expect(result.current.focusIdx).toBe(2);
  });

  it('delegates non-arrow keys to handler', () => {
    const handler = mock(() => {});
    renderHook(() => useMenuNavigation(5, handler));
    fireKey(13);
    expect(handler).toHaveBeenCalledWith(13);
  });

  it('does not delegate arrow keys to handler', () => {
    const handler = mock(() => {});
    renderHook(() => useMenuNavigation(5, handler));
    fireKey(38);
    fireKey(40);
    expect(handler).not.toHaveBeenCalled();
  });
});
