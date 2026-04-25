import React from 'react';
import { render, screen } from '@testing-library/react';
import AgentBanner from '@/components/soc/AgentBanner';
import type { AgentState } from '@/lib/types';

const baseState: AgentState = {
  objective: 'Test objective',
  reasoning: 'Test reasoning',
  confidence: 80,
  currentTool: null,
  phase: 'scanning',
};

function renderBanner(overrides: Partial<AgentState> = {}) {
  return render(<AgentBanner state={{ ...baseState, ...overrides }} />);
}

describe('AgentBanner — phase labels', () => {
  it('shows SCANNING for scanning phase', () => {
    renderBanner({ phase: 'scanning' });
    expect(screen.getByText(/SCANNING/)).toBeInTheDocument();
  });

  it('shows INVESTIGATING for investigating phase', () => {
    renderBanner({ phase: 'investigating' });
    expect(screen.getByText(/INVESTIGATING/)).toBeInTheDocument();
  });

  it('shows CORRELATING for correlating phase', () => {
    renderBanner({ phase: 'correlating' });
    expect(screen.getByText(/CORRELATING/)).toBeInTheDocument();
  });

  it('shows CONCLUDED for concluded phase', () => {
    renderBanner({ phase: 'concluded' });
    expect(screen.getByText(/CONCLUDED/)).toBeInTheDocument();
  });
});

describe('AgentBanner — content fields', () => {
  it('renders the objective text', () => {
    renderBanner({ objective: 'Investigate the anomaly' });
    expect(screen.getByText('Investigate the anomaly')).toBeInTheDocument();
  });

  it('renders the reasoning text', () => {
    renderBanner({ reasoning: 'Tracing supply-chain compromise' });
    expect(screen.getByText('Tracing supply-chain compromise')).toBeInTheDocument();
  });

  it('renders the confidence value with % suffix', () => {
    renderBanner({ confidence: 72 });
    expect(screen.getByText('72%')).toBeInTheDocument();
  });
});

describe('AgentBanner — currentTool', () => {
  it('shows the active tool name when currentTool is a string', () => {
    renderBanner({ currentTool: 'VirusTotal Lookup' });
    expect(screen.getByText('VirusTotal Lookup')).toBeInTheDocument();
  });

  it('does not render the Active Tool section when currentTool is null', () => {
    renderBanner({ currentTool: null });
    expect(screen.queryByText('Active Tool')).not.toBeInTheDocument();
  });
});

describe('AgentBanner — confidence colour thresholds', () => {
  it('applies green class when confidence >= 80', () => {
    renderBanner({ confidence: 80 });
    const confidenceEl = screen.getByText('80%');
    expect(confidenceEl.className).toContain('text-green-400');
  });

  it('applies green class when confidence is 100', () => {
    renderBanner({ confidence: 100 });
    const confidenceEl = screen.getByText('100%');
    expect(confidenceEl.className).toContain('text-green-400');
  });

  it('applies amber class when confidence is between 50 and 79', () => {
    renderBanner({ confidence: 65 });
    const confidenceEl = screen.getByText('65%');
    expect(confidenceEl.className).toContain('text-amber-400');
  });

  it('applies amber class at exactly 50', () => {
    renderBanner({ confidence: 50 });
    const confidenceEl = screen.getByText('50%');
    expect(confidenceEl.className).toContain('text-amber-400');
  });

  it('applies red class when confidence < 50', () => {
    renderBanner({ confidence: 49 });
    const confidenceEl = screen.getByText('49%');
    expect(confidenceEl.className).toContain('text-red-400');
  });

  it('applies red class when confidence is 0', () => {
    renderBanner({ confidence: 0 });
    const confidenceEl = screen.getByText('0%');
    expect(confidenceEl.className).toContain('text-red-400');
  });
});
