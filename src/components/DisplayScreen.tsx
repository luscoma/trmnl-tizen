import { useEffect, useRef } from 'react';
import { trmnlApi } from '../api';
import { useAutoHide } from '../hooks/useAutoHide';
import { StatusBar } from './StatusBar';
import styles from './DisplayScreen.module.css';
import { useKeyNavigation } from '../hooks/useKeyNavigation';

interface Props {
  active: boolean;
  imageUrl: string | null;
  loading: boolean;
  countdown: string;
  onDoRefresh: (reloadCurrent: boolean) => Promise<void>;
  onSettings: () => void;
}

export function DisplayScreen({ active, imageUrl, loading, countdown, onDoRefresh, onSettings }: Props) {
  const statusBar = useAutoHide(4000);

  useKeyNavigation((keyCode) => {
    if (!active) return;
    switch (keyCode) {
      case 13: // OK — settings if status bar visible, otherwise refresh
        statusBar.visible ? onSettings() : onDoRefresh(true);
        return;
      case 39: // RIGHT → next screen
        onDoRefresh(false);
        return;
      case 37: // LEFT → previous screen
        trmnlApi.triggerSpecialFunction();
        return;
      case 40: // DOWN → show status bar
        statusBar.show();
        return;
    }
  });

  return (
    <div className={styles.screen}>
      {imageUrl && (
        <img className={styles.image} src={imageUrl} alt="TRMNL Display" />
      )}
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p className={styles.loadingLabel}>Loading&hellip;</p>
        </div>
      )}
      {!imageUrl && !loading && (
        <div className={styles.noImage}>
          <p className={styles.noImageLabel}>No image available</p>
          <p className={styles.hint}>Press OK to refresh</p>
        </div>
      )}
      <StatusBar countdown={countdown} visible={statusBar.visible} />
    </div>
  );
}
