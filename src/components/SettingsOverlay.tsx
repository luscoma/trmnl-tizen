import { Dispatch } from 'react';
import { RESOLUTIONS } from '../api';
import { useMenuNavigation } from '../hooks/useKeyNavigation';
import type { AppStateAction, Resolution } from '../storage';
import styles from './SettingsOverlay.module.css';

export interface SettingsItem {
  action: 'resolution' | 'edit-key' | 'reset';
  value?: Resolution;
  label: string;
}

export const SETTINGS_ITEMS: SettingsItem[] = [
  { action: 'resolution', value: 'tv', label: RESOLUTIONS.tv.label },
  { action: 'resolution', value: 'og', label: RESOLUTIONS.og.label },
  { action: 'resolution', value: 'x',  label: RESOLUTIONS.x.label  },
  { action: 'edit-key',                label: 'Edit API Key'        },
  { action: 'reset',                   label: 'Reset All Data'      },
];

interface Props {
  currentResolution: Resolution;
  dispatch: Dispatch<AppStateAction>;
  onEditKey: () => void;
  onReset: () => void;
  onClose: () => void;
  onCancel: () => void;
}

export function SettingsOverlay({ currentResolution, dispatch, onEditKey, onReset, onClose, onCancel }: Props) {
  const { focusIdx } = useMenuNavigation(SETTINGS_ITEMS.length, (code) => { 
    switch(code) {
      case 13: {
        const item = SETTINGS_ITEMS[focusIdx];
        if (!item) return;
        if (item.action === 'resolution' && item.value) {
          dispatch({ type: 'set-resolution', resolution: item.value });
          onClose();
       }
        else if (item.action === 'edit-key') onEditKey();
        else if (item.action === 'reset') onReset();
        return;
      }
      case 27:    // ESC
      case 73:   // i 
      case 457:   // INFO
      case 10009: // RETURN
        onCancel(); return;
    }
  });

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2 className={styles.title}>Settings</h2>
        <p className={styles.sectionLabel}>Resolution</p>
        <ul className={styles.list}>
          {SETTINGS_ITEMS.map((item, i) => {
            const focused = i === focusIdx;
            const isDanger = item.action === 'reset';
            const cls = [
              styles.item,
              focused  ? styles.itemFocused : '',
              isDanger ? styles.itemDanger  : '',
            ].filter(Boolean).join(' ');
            return (
              <li key={i} className={cls}>
                {item.action === 'resolution' && (
                  <span className={`${styles.radio}${currentResolution === item.value ? ' ' + styles.radioOn : ''}`} />
                )}
                {item.label}
              </li>
            );
          })}
        </ul>
        <p className={styles.hint}>&#x2191;&#x2193;&nbsp;Navigate &nbsp;&nbsp;&nbsp; OK&nbsp;Select &nbsp;&nbsp;&nbsp; RETURN&nbsp;Close</p>
      </div>
    </div>
  );
}
