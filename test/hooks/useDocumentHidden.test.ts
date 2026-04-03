import { describe, it, expect } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useDocumentHidden } from '../../src/hooks/useDocumentHidden';

describe('useDocumentHidden', () => {
  it('returns current document.hidden value', () => {
    const { result } = renderHook(() => useDocumentHidden());
    expect(result.current).toBe(document.hidden);
  });

  it('updates when visibilitychange fires', () => {
    const { result } = renderHook(() => useDocumentHidden());

    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(result.current).toBe(true);

    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(result.current).toBe(false);
  });
});
