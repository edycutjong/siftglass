import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@xyflow/react', () => ({
  Handle: ({ type }: { type: string }) => <div data-testid={`handle-${type}`} />,
  Position: { Left: 'Left', Right: 'Right' },
}));

import InvestigationNodeComponent from '@/components/soc/InvestigationNode';

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      label: 'test-label',
      nodeType: 'ip',
      status: 'benign',
      confidence: 75,
      details: 'Some details',
      ...overrides,
    },
  } as any;
}

describe('InvestigationNodeComponent — node type icons', () => {
  const typeIcons: [string, string][] = [
    ['ip', '🌐'],
    ['domain', '🔗'],
    ['hash', '🔑'],
    ['process', '⚙️'],
    ['file', '📄'],
    ['user', '👤'],
    ['network', '🛜'],
  ];

  it.each(typeIcons)('renders %s icon %s', (nodeType, icon) => {
    render(<InvestigationNodeComponent {...makeProps({ nodeType })} />);
    expect(screen.getByText(icon)).toBeInTheDocument();
  });

  it('renders fallback ❓ for unknown node type', () => {
    render(<InvestigationNodeComponent {...makeProps({ nodeType: 'unknown' })} />);
    expect(screen.getByText('❓')).toBeInTheDocument();
  });
});

describe('InvestigationNodeComponent — content', () => {
  it('renders the label', () => {
    render(<InvestigationNodeComponent {...makeProps({ label: '192.168.1.42' })} />);
    expect(screen.getByText('192.168.1.42')).toBeInTheDocument();
  });

  it('renders the details', () => {
    render(<InvestigationNodeComponent {...makeProps({ details: 'This is a detail string' })} />);
    expect(screen.getByText('This is a detail string')).toBeInTheDocument();
  });

  it('renders the confidence percentage', () => {
    render(<InvestigationNodeComponent {...makeProps({ confidence: 88 })} />);
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('renders both handles', () => {
    render(<InvestigationNodeComponent {...makeProps()} />);
    expect(screen.getByTestId('handle-target')).toBeInTheDocument();
    expect(screen.getByTestId('handle-source')).toBeInTheDocument();
  });
});

describe('InvestigationNodeComponent — status styles', () => {
  const statuses = ['investigating', 'malicious', 'benign', 'shattered'] as const;

  it.each(statuses)('renders without throwing for status %s', (status) => {
    expect(() =>
      render(<InvestigationNodeComponent {...makeProps({ status })} />)
    ).not.toThrow();
  });

  it('applies border-red-500 class for malicious status', () => {
    const { container } = render(<InvestigationNodeComponent {...makeProps({ status: 'malicious' })} />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain('border-red-500');
  });

  it('applies border-cyan-500 class for investigating status', () => {
    const { container } = render(<InvestigationNodeComponent {...makeProps({ status: 'investigating' })} />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain('border-cyan-500');
  });

  it('applies border-green-500 class for benign status', () => {
    const { container } = render(<InvestigationNodeComponent {...makeProps({ status: 'benign' })} />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain('border-green-500');
  });

  it('applies border-slate-600 class for shattered status', () => {
    const { container } = render(<InvestigationNodeComponent {...makeProps({ status: 'shattered' })} />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain('border-slate-600');
  });
});

describe('InvestigationNodeComponent — confidence bar', () => {
  it('sets confidence bar width via inline style', () => {
    const { container } = render(<InvestigationNodeComponent {...makeProps({ confidence: 60 })} />);
    const bar = container.querySelector('[style*="width: 60%"]') as HTMLElement;
    expect(bar).toBeInTheDocument();
  });

  it('uses red bar for malicious status', () => {
    const { container } = render(
      <InvestigationNodeComponent {...makeProps({ status: 'malicious', confidence: 90 })} />
    );
    const bar = container.querySelector('[style*="width: 90%"]') as HTMLElement;
    expect(bar.className).toContain('bg-red-500');
  });

  it('uses cyan bar for investigating status', () => {
    const { container } = render(
      <InvestigationNodeComponent {...makeProps({ status: 'investigating', confidence: 70 })} />
    );
    const bar = container.querySelector('[style*="width: 70%"]') as HTMLElement;
    expect(bar.className).toContain('bg-cyan-500');
  });

  it('uses zinc bar for shattered status', () => {
    const { container } = render(
      <InvestigationNodeComponent {...makeProps({ status: 'shattered', confidence: 15 })} />
    );
    const bar = container.querySelector('[style*="width: 15%"]') as HTMLElement;
    expect(bar.className).toContain('bg-zinc-600');
  });

  it('uses green bar for benign status', () => {
    const { container } = render(
      <InvestigationNodeComponent {...makeProps({ status: 'benign', confidence: 50 })} />
    );
    const bar = container.querySelector('[style*="width: 50%"]') as HTMLElement;
    expect(bar.className).toContain('bg-green-500');
  });
});

describe('InvestigationNodeComponent — status indicator dots', () => {
  it('renders a red pulse dot for malicious status', () => {
    const { container } = render(
      <InvestigationNodeComponent {...makeProps({ status: 'malicious' })} />
    );
    expect(container.querySelector('.bg-red-500.animate-pulse')).toBeInTheDocument();
  });

  it('renders a cyan pulse dot for investigating status', () => {
    const { container } = render(
      <InvestigationNodeComponent {...makeProps({ status: 'investigating' })} />
    );
    expect(container.querySelector('.bg-cyan-500.animate-pulse')).toBeInTheDocument();
  });

  it('does not render a pulse dot for benign status', () => {
    const { container } = render(
      <InvestigationNodeComponent {...makeProps({ status: 'benign' })} />
    );
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });

  it('does not render a pulse dot for shattered status', () => {
    const { container } = render(
      <InvestigationNodeComponent {...makeProps({ status: 'shattered' })} />
    );
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });
});
