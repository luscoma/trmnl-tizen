import { useRef, useEffect, Dispatch } from 'react';
import styles from './OnboardingScreen.module.css';
import { AppStateAction } from '../storage';

interface Props {
  dispatch: Dispatch<AppStateAction>;
  onClose: () => void;
  onExit: () => void;
}

export function OnboardingScreen({ dispatch, onClose, onExit }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  function submit() {
    const apiKey = inputRef.current?.value.trim() ?? '';
    if (apiKey) {
      dispatch({ type: 'set-api-key', apiKey });
      onClose();
    } else {
      inputRef.current?.focus();
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    switch (e.keyCode) {
      case 40:    // ArrowDown
        e.preventDefault();
        buttonRef.current?.focus();
        break;
      case 27:    // ESC
      case 10009: // RETURN
        onExit();
        break;
    }
  }

  function handleButtonKeyDown(e: React.KeyboardEvent) {
    switch (e.keyCode) {
      case 13:    // OK
        e.preventDefault();
        submit();
        break;
      case 38:    // ArrowUp
        e.preventDefault();
        inputRef.current?.focus();
        break;
      case 27:    // ESC
      case 10009: // RETURN
        onExit();
        break;
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.wordmark}>TRMNL</h1>
        <p className={styles.sub}>Enter your device API key to get started</p>
      </div>
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        placeholder="Type your API key here"
        autoComplete="off"
        spellCheck={false}
        onKeyDown={handleInputKeyDown}
      />
      <button
        ref={buttonRef}
        className={styles.button}
        onKeyDown={handleButtonKeyDown}
        onClick={submit}
      >
        Connect
      </button>
      <p className={styles.hint}>&#x25BC;&nbsp;Navigate &nbsp;&nbsp;&nbsp; OK&nbsp;Connect &nbsp;&nbsp;&nbsp; RETURN&nbsp;Exit</p>
    </div>
  );
}
