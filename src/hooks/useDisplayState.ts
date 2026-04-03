// useDisplayState.ts — image fetch logic for the display screen
import { useState, useRef, useCallback } from 'react';
import type { Dispatch } from 'react';
import type { AppState, AppStateAction } from '../storage';
import { trmnlApi, HttpError, RESOLUTIONS } from '../api';
import { toast } from 'sonner';

type DisplayStateInput = Pick<AppState, 'apiKey' | 'resolution' | 'currentImage'>;

export function useDisplayState(appState: DisplayStateInput, dispatch: Dispatch<AppStateAction>) {
  const { apiKey, resolution, currentImage } = appState;

  const [imageUrl, setImageUrl] = useState<string | null>(() => currentImage?.url ?? null);
  const [loading, setLoading]   = useState(false);

  const isLoadingRef = useRef(false);

  const doRefresh = useCallback(async (reloadCurrent: boolean) => {
    if (isLoadingRef.current) {
      toast('One sec, the next image is already loading.');
      return;
    }
    if (!apiKey) return;

    isLoadingRef.current = true;
    setLoading(true);
    try {
      const dims      = RESOLUTIONS[resolution] ?? RESOLUTIONS.tv;
      const result    = await trmnlApi.fetchImage(apiKey, dims, currentImage?.originalUrl ?? null, reloadCurrent);
      const now       = Date.now();
      const nextFetch = now + result.refreshRate * 1000;

      dispatch({ type: 'fetch-complete',
        currentImage: result.unchanged ? null : { url: result.dataUrl, originalUrl: result.originalUrl, filename: result.filename, timestamp: now },
        refreshRate:  result.refreshRate,
        nextFetch,
      });
      if (!result.unchanged) {
        setImageUrl(result.dataUrl);
      }
    } catch (e) {
      if (e instanceof HttpError && (e.status === 401 || e.status === 403)) {
        toast.error('Invalid API key.');
      } else if (e instanceof HttpError && e.status === 429) {
        toast.error('Rate limited — try again in a few seconds.');
      } else if (e instanceof HttpError && e.status === 500) {
        toast.error('Server error. Will retry.');
      } else {
        toast.error('Network error. Will retry.');
      }
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [apiKey, resolution, currentImage, dispatch]);

  return { imageUrl, loading, doRefresh };
}
