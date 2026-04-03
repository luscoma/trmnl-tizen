import { useState, useReducer, useEffect, useRef, useCallback, use } from 'react';
import CONFIG from '../config';
import { getAppState, appStateReducer } from '../storage';
import { RESOLUTIONS } from '../api';
import { tizenBridge } from '../tizen';
import { useDisplayState } from '../hooks/useDisplayState';
import { useFetchTimer } from '../hooks/useFetchTimer';
import { useDocumentHidden } from '../hooks/useDocumentHidden';
import { OnboardingScreen } from './OnboardingScreen';
import { DisplayScreen } from './DisplayScreen';
import { SettingsOverlay } from './SettingsOverlay';
import { EditKeyOverlay } from './EditKeyOverlay';
import { DevToolsOverlay } from './DevToolsOverlay';
import { Toaster, toast } from 'sonner';
import { useKeyNavigation } from '../hooks/useKeyNavigation'; 
import type { Resolution } from '../storage';

type Screen = 'onboarding' | 'display' | 'settings' | 'edit-key' | 'dev-menu';

function applyResolution(resolution: Resolution): void {
  const dims  = RESOLUTIONS[resolution] ?? RESOLUTIONS.tv;
  const scale = Math.min(window.innerWidth / dims.width, window.innerHeight / dims.height);
  const canvas = document.getElementById('image-canvas') as HTMLElement | null;
  if (canvas) {
    // We scale things as best we can
    canvas.style.width  = Math.round(dims.width  * scale) + 'px';
    canvas.style.height = Math.round(dims.height * scale) + 'px';
    // But still ensure max width/height never exceeds the actual requested resolution
    canvas.style.maxWidth  = dims.width + 'px';
    canvas.style.maxHeight = dims.height + 'px';
  }
}

export function App() {
  const [appState, dispatch] = useReducer(appStateReducer, undefined, () => {
    // Apply CONFIG.API_KEY override synchronously so the hook and initial screen
    // state both see the correct key from the very first render.
    const configKey = CONFIG.API_KEY?.trim() ?? '';
    const state = getAppState();
    if (configKey && state.apiKey !== configKey) {
      return appStateReducer(state, { type: 'set-api-key', apiKey: configKey });
    }
    return state;
  });

  const [screen, setScreen] = useState<Screen>(() => appState.apiKey ? 'display' : 'onboarding');

  const hidden = useDocumentHidden();
  const { imageUrl, loading, doRefresh } = useDisplayState(appState, dispatch);
  const countdown = useFetchTimer(hidden ? null : appState.nextFetch, () => doRefresh(false));

  const screenRef = useRef<Screen>(screen);
  screenRef.current = screen;

  // ── Init / resume on visibility ────────────────────────────────────────────

  useEffect(() => {
    if (hidden) return;
    if (!appState.apiKey) return;
    if (!appState.nextFetch || Date.now() >= appState.nextFetch) doRefresh(false);
  }, [hidden, doRefresh]);

  // ── Submit API key ─────────────────────────────────────────────────────────

  const closeAndRefresh = useCallback(async () => {
    setScreen('display');
    await doRefresh(true);
  }, []);

  // ── Resolution change ──────────────────────────────────────────────────────

  useEffect(() => {
    applyResolution(appState.resolution);
  }, [appState.resolution]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    dispatch({ type: 'reset' });
    tizenBridge.exit();
  }, []);

  // ── Sim exit toast ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!CONFIG.SIMULATE_TIZEN) return;
    function onSimExit() { toast('Exit triggered in simulator'); }
    document.addEventListener('trmnl:sim-exit', onSimExit);
    return () => document.removeEventListener('trmnl:sim-exit', onSimExit);
  }, []);

  // ── Global keyboard handler ─────────────────────────────────────────────────
  // Only top-level keys: launch overlays, exit. Overlays and display handle their own.
  useKeyNavigation((keyCode) => {
    if (screenRef.current !== 'display') return;
    switch (keyCode) {
      case 457:   // INFO
      case 73:    // i
        setScreen('settings'); return;
      case 68:    // d
        setScreen('dev-menu'); return;
      case 10009: // RETURN
        tizenBridge.exit(); return;
    }
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  const showDisplay = screen === 'display' || screen === 'settings' || screen === 'edit-key' || screen === 'dev-menu';

  return (
    <div id="image-canvas">
      {screen === 'onboarding' && (
        <OnboardingScreen
          dispatch={dispatch}
          onClose={closeAndRefresh}
          onExit={() => tizenBridge.exit()}
        />
      )}

      {showDisplay && (
        <DisplayScreen
          active={screen === 'display'}
          imageUrl={hidden ? null : imageUrl}
          loading={loading}
          countdown={countdown}
          onDoRefresh={doRefresh}
          onSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'settings' && (
        <SettingsOverlay
          currentResolution={appState.resolution}
          dispatch={dispatch}
          onClose={closeAndRefresh}
          onCancel={() => setScreen('display')}
          onEditKey={() => setScreen('edit-key')}
          onReset={handleReset}
        />
      )}

      {screen === 'edit-key' && (
        <EditKeyOverlay
          currentKey={appState.apiKey ?? ''}
          dispatch={dispatch}
          onClose={closeAndRefresh}
          onCancel={() => setScreen('settings')}
        />
      )}

      {screen === 'dev-menu' && (
        <DevToolsOverlay
          appState={appState}
          onClose={() => setScreen('display')}
        />
      )}

      <Toaster theme="dark" position="bottom-center" />
    </div>
  );
}
