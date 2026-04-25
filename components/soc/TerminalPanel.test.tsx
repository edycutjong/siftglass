import React from 'react';
import { render, screen } from '@testing-library/react';
import TerminalPanel from '@/components/soc/TerminalPanel';
import type { TerminalLine } from '@/lib/types';

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

function makeLine(overrides: Partial<TerminalLine> = {}): TerminalLine {
  return {
    id: 'line-1',
    timestamp: 1776836520000, // 2026-04-21T03:42:00.000Z
    type: 'info',
    content: 'Test content',
    ...overrides,
  };
}

describe('TerminalPanel — renders correctly', () => {
  it('renders the terminal header', () => {
    render(<TerminalPanel lines={[]} />);
    expect(screen.getByText(/Investigation Terminal/i)).toBeInTheDocument();
  });

  it('renders all provided lines', () => {
    const lines = [
      makeLine({ id: 'a', content: 'Line A' }),
      makeLine({ id: 'b', content: 'Line B' }),
      makeLine({ id: 'c', content: 'Line C' }),
    ];
    render(<TerminalPanel lines={lines} />);
    expect(screen.getByText('Line A')).toBeInTheDocument();
    expect(screen.getByText('Line B')).toBeInTheDocument();
    expect(screen.getByText('Line C')).toBeInTheDocument();
  });

  it('renders with empty lines list without crashing', () => {
    expect(() => render(<TerminalPanel lines={[]} />)).not.toThrow();
  });
});

describe('TerminalPanel — line type prefixes', () => {
  const prefixMap: [TerminalLine['type'], string][] = [
    ['info', '[INFO]'],
    ['warning', '[WARN]'],
    ['error', '[ALRT]'],
    ['success', '[ OK ]'],
    ['agent', '[AGNT]'],
  ];

  it.each(prefixMap)('type %s renders prefix %s', (type, prefix) => {
    render(<TerminalPanel lines={[makeLine({ id: type, type, content: `${type} content` })]} />);
    expect(screen.getByText(prefix)).toBeInTheDocument();
  });
});

describe('TerminalPanel — line type colours', () => {
  const colourMap: [TerminalLine['type'], string][] = [
    ['info', 'text-zinc-300'],
    ['warning', 'text-amber-400'],
    ['error', 'text-red-400'],
    ['success', 'text-green-400'],
    ['agent', 'text-cyan-400'],
  ];

  it.each(colourMap)('type %s applies %s class to content', (type, className) => {
    const { container } = render(
      <TerminalPanel lines={[makeLine({ id: type, type, content: `${type}-message` })]} />
    );
    const contentEl = screen.getByText(`${type}-message`);
    expect(contentEl.className).toContain(className);
  });
});

describe('TerminalPanel — formatTime', () => {
  it('renders a timestamp for each line (matches HH:MM:SS format or placeholder)', () => {
    const { container } = render(
      <TerminalPanel lines={[makeLine({ timestamp: 1776836520000 })]} />
    );
    // The timestamp span uses text-zinc-500 after the linter update
    const timeEls = container.querySelectorAll('span.flex-shrink-0');
    expect(timeEls.length).toBeGreaterThan(0);
    // After mount useEffect, the formatted time (HH:MM:SS) or pre-mount placeholder '--:--:--'
    const text = timeEls[0].textContent ?? '';
    expect(text).toMatch(/(\d{2}:\d{2}:\d{2}|--:--:--)/);
  });
});

describe('TerminalPanel — auto-scroll', () => {
  it('calls scrollIntoView on initial render', () => {
    render(<TerminalPanel lines={[makeLine()]} />);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('calls scrollIntoView when lines change', () => {
    const { rerender } = render(<TerminalPanel lines={[makeLine()]} />);
    const callsBefore = (window.HTMLElement.prototype.scrollIntoView as jest.Mock).mock.calls.length;
    rerender(<TerminalPanel lines={[makeLine(), makeLine({ id: 'line-2', content: 'New line' })]} />);
    expect((window.HTMLElement.prototype.scrollIntoView as jest.Mock).mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
