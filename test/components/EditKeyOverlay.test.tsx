import { describe, it, expect, mock, jest, beforeEach, afterEach } from 'bun:test';
import { render, act } from '@testing-library/react';
import React from 'react';

mock.module('../../src/components/EditKeyOverlay.module.css', () => ({
  default: new Proxy({}, { get: (_, p) => String(p) }),
}));

const { EditKeyOverlay } = await import('../../src/components/EditKeyOverlay');

describe('EditKeyOverlay', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  function fireKey(el: Element, keyCode: number) {
    act(() => {
      el.dispatchEvent(new KeyboardEvent('keydown', { keyCode, bubbles: true } as KeyboardEventInit));
    });
  }

  function setup(currentKey = 'existing-key') {
    const dispatch = mock(() => {});
    const onClose  = mock(() => {});
    const onCancel = mock(() => {});
    const { getByRole, getByText } = render(
      <EditKeyOverlay
        currentKey={currentKey}
        dispatch={dispatch as any}
        onClose={onClose}
        onCancel={onCancel}
      />,
    );
    return { dispatch, onClose, onCancel, getByRole, getByText };
  }

  it('renders the Edit API Key heading', () => {
    const { getByText } = setup();
    expect(getByText('Edit API Key')).toBeDefined();
  });

  it('pre-fills input with currentKey', () => {
    const { getByRole } = setup('my-key');
    act(() => { jest.advanceTimersByTime(100); });
    const input = getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('my-key');
  });

  it('Enter with non-empty value dispatches set-api-key and calls onClose', () => {
    const { dispatch, onClose, getByRole, getByText } = setup();
    act(() => { jest.advanceTimersByTime(100); });
    const input = getByRole('textbox') as HTMLInputElement;
    input.value = 'new-key';
    fireKey(getByText('Save'), 13); // OK on Save button
    expect(dispatch.mock.calls[0][0]).toEqual({ type: 'set-api-key', apiKey: 'new-key' });
    expect(onClose).toHaveBeenCalled();
  });

  it('Enter with empty value does not dispatch or close', () => {
    const { dispatch, onClose, getByRole } = setup();
    const input = getByRole('textbox') as HTMLInputElement;
    input.value = '   ';
    fireKey(input, 13);
    expect(dispatch).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Escape calls onCancel', () => {
    const { onCancel, getByRole } = setup();
    const input = getByRole('textbox');
    fireKey(input, 27);
    expect(onCancel).toHaveBeenCalled();
  });

  it('RETURN (10009) calls onCancel', () => {
    const { onCancel, getByRole } = setup();
    const input = getByRole('textbox');
    fireKey(input, 10009);
    expect(onCancel).toHaveBeenCalled();
  });

  it('Escape does not dispatch', () => {
    const { dispatch, getByRole } = setup();
    fireKey(getByRole('textbox'), 27);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
