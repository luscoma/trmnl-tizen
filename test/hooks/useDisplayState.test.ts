import { describe, it, expect, beforeEach, afterEach, mock as bunMock } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useDisplayState } from '../../src/hooks/useDisplayState';
import { stubApi, resetApi, HttpError } from '../../src/api';
import type { AppState, StoredImage } from '../../src/storage';

// Mock sonner's toast
const mockToast = bunMock(() => {}) as ReturnType<typeof bunMock> & { error: ReturnType<typeof bunMock> };
mockToast.error = bunMock(() => {});
bunMock.module('sonner', () => ({
  toast: mockToast,
  Toaster: () => null,
}));

type DisplayStateInput = Pick<AppState, 'apiKey' | 'resolution' | 'currentImage'>;

const SAMPLE_IMAGE: StoredImage = {
  url: 'data:image/png;base64,abc',
  originalUrl: 'https://example.com/img.png',
  filename: 'test.png',
  timestamp: 1000,
};

describe('useDisplayState', () => {
  const dispatch = bunMock(() => {});

  beforeEach(() => {
    dispatch.mockClear();
    mockToast.mockClear();
    mockToast.error.mockClear();
  });

  afterEach(() => {
    resetApi();
  });

  function makeInput(overrides: Partial<DisplayStateInput> = {}): DisplayStateInput {
    return {
      apiKey: 'test-key',
      resolution: 'tv',
      currentImage: null,
      ...overrides,
    };
  }

  function stubSuccess(imageUrl = 'https://example.com/new.png') {
    stubApi({
      fetchImage: bunMock((() =>
        Promise.resolve({
          unchanged: false,
          dataUrl: 'data:image/png;base64,new',
          originalUrl: imageUrl,
          filename: 'screen.png',
          refreshRate: 60,
        })
      ) as any),
    });
  }

  function stubUnchanged() {
    stubApi({
      fetchImage: bunMock((() =>
        Promise.resolve({ unchanged: true, refreshRate: 60 })
      ) as any),
    });
  }

  function stubError(status: number) {
    stubApi({
      fetchImage: bunMock((() =>
        Promise.reject(new HttpError(status))
      ) as any),
    });
  }

  function stubNetworkError() {
    stubApi({
      fetchImage: bunMock((() =>
        Promise.reject(new Error('network'))
      ) as any),
    });
  }

  it('returns initial imageUrl from currentImage', () => {
    const { result } = renderHook(() =>
      useDisplayState(makeInput({ currentImage: SAMPLE_IMAGE }), dispatch),
    );
    expect(result.current.imageUrl).toBe(SAMPLE_IMAGE.url);
  });

  it('returns null imageUrl when no current image', () => {
    const { result } = renderHook(() =>
      useDisplayState(makeInput(), dispatch),
    );
    expect(result.current.imageUrl).toBeNull();
  });

  it('loading is initially false', () => {
    const { result } = renderHook(() =>
      useDisplayState(makeInput(), dispatch),
    );
    expect(result.current.loading).toBe(false);
  });

  it('doRefresh dispatches fetch-complete on success', async () => {
    stubSuccess();
    const { result } = renderHook(() =>
      useDisplayState(makeInput(), dispatch),
    );
    await act(async () => { await result.current.doRefresh(false); });
    expect(dispatch).toHaveBeenCalled();
    const action = dispatch.mock.calls[0][0];
    expect(action.type).toBe('fetch-complete');
  });

  it('doRefresh updates imageUrl on new image', async () => {
    stubSuccess();
    const { result } = renderHook(() =>
      useDisplayState(makeInput(), dispatch),
    );
    await act(async () => { await result.current.doRefresh(false); });
    expect(result.current.imageUrl).toBe('data:image/png;base64,new');
  });

  it('doRefresh does not update imageUrl when unchanged', async () => {
    stubUnchanged();
    const { result } = renderHook(() =>
      useDisplayState(makeInput({ currentImage: SAMPLE_IMAGE }), dispatch),
    );
    await act(async () => { await result.current.doRefresh(false); });
    expect(result.current.imageUrl).toBe(SAMPLE_IMAGE.url);
  });

  it('doRefresh is a no-op when apiKey is null', async () => {
    stubSuccess();
    const { result } = renderHook(() =>
      useDisplayState(makeInput({ apiKey: null }), dispatch),
    );
    await act(async () => { await result.current.doRefresh(false); });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('doRefresh shows toast on 401', async () => {
    stubError(401);
    const { result } = renderHook(() =>
      useDisplayState(makeInput(), dispatch),
    );
    await act(async () => { await result.current.doRefresh(false); });
    expect(mockToast.error).toHaveBeenCalledWith('Invalid API key.');
  });

  it('doRefresh shows toast on 429', async () => {
    stubError(429);
    const { result } = renderHook(() =>
      useDisplayState(makeInput(), dispatch),
    );
    await act(async () => { await result.current.doRefresh(false); });
    expect(mockToast.error).toHaveBeenCalledWith('Rate limited — try again in a few seconds.');
  });

  it('doRefresh shows toast on 500', async () => {
    stubError(500);
    const { result } = renderHook(() =>
      useDisplayState(makeInput(), dispatch),
    );
    await act(async () => { await result.current.doRefresh(false); });
    expect(mockToast.error).toHaveBeenCalledWith('Server error. Will retry.');
  });

  it('doRefresh shows network error toast on generic error', async () => {
    stubNetworkError();
    const { result } = renderHook(() =>
      useDisplayState(makeInput(), dispatch),
    );
    await act(async () => { await result.current.doRefresh(false); });
    expect(mockToast.error).toHaveBeenCalledWith('Network error. Will retry.');
  });

  it('guards concurrent fetches', async () => {
    stubApi({
      fetchImage: bunMock((() => new Promise(() => {})) as any),
    });
    const { result } = renderHook(() =>
      useDisplayState(makeInput(), dispatch),
    );
    act(() => { result.current.doRefresh(false); });
    await act(async () => { await result.current.doRefresh(false); });
    expect(mockToast).toHaveBeenCalledWith('One sec, the next image is already loading.');
  });

  it('passes reloadCurrent flag to fetchImage', async () => {
    const mockFetch = bunMock((() =>
      Promise.resolve({ unchanged: true, refreshRate: 60 })
    ) as any);
    stubApi({ fetchImage: mockFetch });
    const { result } = renderHook(() =>
      useDisplayState(makeInput(), dispatch),
    );
    await act(async () => { await result.current.doRefresh(true); });
    expect(mockFetch.mock.calls[0][3]).toBe(true);
  });
});
