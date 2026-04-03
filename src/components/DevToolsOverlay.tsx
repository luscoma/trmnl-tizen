import CONFIG from '../config';
import { devBridge } from '../devtools';
import type { AppState } from '../storage';
import { useMenuNavigation } from '../hooks/useKeyNavigation';
import styles from './DevToolsOverlay.module.css';

export interface DevItem {
  code: 429 | 500 | null;
  label: string;
}

export const DEV_ITEMS: DevItem[] = [
  { code: 429,  label: 'Force 429 — Rate Limited' },
  { code: 500,  label: 'Force 500 — Server Error'  },
  { code: null, label: 'Clear'                      },
];

type DevToolsAppState = Pick<AppState, 'lastFetch' | 'nextFetch' | 'currentImage'>;

interface Props {
  appState: DevToolsAppState;
  onClose: () => void;
}

function toIso(ms: number | null): string {
  return ms ? new Date(ms).toISOString() : '(none)';
}

export function DevToolsOverlay({ appState, onClose }: Props) {
  const { focusIdx } = useMenuNavigation(DEV_ITEMS.length, (code) => {
    switch(code) {
      case 13: {
        const item = DEV_ITEMS[focusIdx];
        if (item) {
          devBridge.setForcedResponse(item.code);
          onClose();
        }
        return;
      }
      case 27:    // ESC
      case 68:    // d
      case 10009: // RETURN
        onClose(); return;
    }
  });

  const maskedKey = CONFIG.API_KEY
    ? '\u2022\u2022\u2022\u2022\u2022\u2022' + CONFIG.API_KEY.slice(-6)
    : '(not set)';

  const configEntries: [string, string][] = [
    ['API_KEY',        maskedKey],
    ['SIMULATE_TIZEN', String(CONFIG.SIMULATE_TIZEN)],
  ];

  const stateEntries: Array<{ key: string; text?: string; href?: string }> = [
    { key: 'lastFetch',   text: toIso(appState.lastFetch) },
    { key: 'nextFetch',   text: toIso(appState.nextFetch) },
    { key: 'filename',    text: appState.currentImage?.filename ?? '(none)' },
    {
      key: 'originalUrl',
      text: appState.currentImage?.originalUrl ? undefined : '(none)',
      href: appState.currentImage?.originalUrl,
    },
  ];

  const currentForced = devBridge.getForcedResponse();

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2 className={styles.title}>Developer Tools</h2>

        <p className={styles.sectionLabel}>Build Constants</p>
        <ul className={styles.configList}>
          {configEntries.map(([k, v]) => (
            <li key={k} className={styles.configItem}>
              <span className={styles.configKey}>{k}</span>
              <span className={styles.configVal}>{v}</span>
            </li>
          ))}
        </ul>

        <p className={styles.sectionLabel}>Fetch State</p>
        <ul className={styles.configList}>
          {stateEntries.map(({ key, text, href }) => (
            <li key={key} className={styles.configItem}>
              <span className={styles.configKey}>{key}</span>
              {href
                ? <a className={styles.configLink} href={href} target="_blank" rel="noreferrer">Source</a>
                : <span className={styles.configVal}>{text}</span>
              }
            </li>
          ))}
        </ul>

        <p className={styles.sectionLabel}>Forced API Response</p>
        <ul className={styles.list}>
          {DEV_ITEMS.map((item, i) => {
            const focused = i === focusIdx;
            const active  = item.code === currentForced;
            const cls = [styles.item, focused ? styles.itemFocused : ''].filter(Boolean).join(' ');
            return (
              <li key={i} className={cls}>
                <span className={`${styles.radio}${active ? ' ' + styles.radioOn : ''}`} />
                {item.label}
              </li>
            );
          })}
        </ul>

        <p className={styles.hint}>&#x2191;&#x2193;&nbsp;Navigate &nbsp;&nbsp;&nbsp; OK&nbsp;Select &nbsp;&nbsp;&nbsp; D/RETURN&nbsp;Close</p>
      </div>
    </div>
  );
}
