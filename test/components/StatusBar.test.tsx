import { describe, it, expect, mock } from 'bun:test';
import { render } from '@testing-library/react';
import React from 'react';

mock.module('../../src/components/StatusBar.module.css', () => ({
  default: new Proxy({}, { get: (_, p) => String(p) }),
}));

const { StatusBar } = await import('../../src/components/StatusBar');

describe('StatusBar', () => {
  it('renders nothing when visible is false', () => {
    const { container } = render(<StatusBar countdown="01:30" visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when visible is true', () => {
    const { getByText } = render(<StatusBar countdown="01:30" visible={true} />);
    expect(getByText(/Settings/)).toBeDefined();
  });

  it('displays the countdown', () => {
    const { getByText } = render(<StatusBar countdown="05:42" visible={true} />);
    expect(getByText('05:42')).toBeDefined();
  });

  it('displays keyboard hints', () => {
    const { getByText } = render(<StatusBar countdown="01:00" visible={true} />);
    const hints = getByText(/Next/);
    expect(hints.textContent).toContain('Special');
  });
});
