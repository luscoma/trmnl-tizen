import { useRef, useEffect, type Dispatch } from 'react';
import styles from './EditKeyOverlay.module.css';
import { AppStateAction } from '../storage';

interface Props {
  currentKey: string;
  dispatch: Dispatch<AppStateAction>;
  onClose: () => void;
  onCancel: () => void;
}

export function EditKeyOverlay({ currentKey, dispatch, onClose, onCancel }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = currentKey;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentKey]);

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
        onCancel();
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
        onCancel();
        break;
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2 className={styles.title}>Edit API Key</h2>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Enter new API key…"
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
          Save
        </button>
        <p className={styles.hint}>&#x25BC;&nbsp;Navigate &nbsp;&nbsp;&nbsp; OK&nbsp;Save &nbsp;&nbsp;&nbsp; RETURN&nbsp;Cancel</p>
      </div>
    </div>
  );
}
