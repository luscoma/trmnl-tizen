import styles from './StatusBar.module.css';

interface Props {
  countdown: string;
  visible: boolean;
}

export function StatusBar({ countdown, visible }: Props) {
  if (!visible) return null;
  return (
    <div className={styles.bar}>
      <span className={styles.settings}>&#x2699;&nbsp;Settings</span>
      <span className={styles.countdown}>{countdown}</span>
      <span className={styles.hints}>&#x2192;&nbsp;Next &nbsp;&nbsp; &#x2190;&nbsp;Special</span>
    </div>
  );
}
