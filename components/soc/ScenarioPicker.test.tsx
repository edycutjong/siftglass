import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScenarioPicker from '@/components/soc/ScenarioPicker';
import type { DemoScenario } from '@/lib/demo-data';

function makeScenario(id: string, title: string, description = 'desc'): DemoScenario {
  return {
    id,
    title,
    description,
    nodes: [],
    edges: [],
    agentState: { objective: '', reasoning: '', confidence: 0, currentTool: null, phase: 'scanning' },
    terminal: [],
    positions: {},
  };
}

const SCENARIOS: DemoScenario[] = [
  makeScenario('supply-chain', 'Supply-Chain Attack'),
  makeScenario('ransomware', 'Ransomware Lateral Movement'),
  makeScenario('credential-stuffing', 'Credential Stuffing'),
  makeScenario('insider-threat', 'Insider Threat'),
];

function renderPicker(overrides: Partial<Parameters<typeof ScenarioPicker>[0]> = {}) {
  const onSelect = jest.fn();
  const utils = render(
    <ScenarioPicker
      scenarios={SCENARIOS}
      activeId="supply-chain"
      onSelect={onSelect}
      {...overrides}
    />
  );
  return { ...utils, onSelect };
}

describe('ScenarioPicker — initial render', () => {
  it('renders the trigger button', () => {
    renderPicker();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows the active scenario title in the button', () => {
    renderPicker({ activeId: 'supply-chain' });
    expect(screen.getByText('Supply-Chain Attack')).toBeInTheDocument();
  });

  it('shows the correct icon for each known scenario ID', () => {
    renderPicker({ activeId: 'supply-chain' });
    expect(screen.getByText('📦')).toBeInTheDocument();
  });

  it('shows 🔬 icon for unknown scenario ID', () => {
    renderPicker({ activeId: 'unknown-id' });
    expect(screen.getAllByText('🔬').length).toBeGreaterThan(0);
  });

  it('dropdown is not visible on initial render', () => {
    renderPicker();
    expect(screen.queryByText('Ransomware Lateral Movement')).not.toBeInTheDocument();
  });
});

describe('ScenarioPicker — dropdown toggle', () => {
  it('opens the dropdown when button is clicked', () => {
    renderPicker();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Ransomware Lateral Movement')).toBeInTheDocument();
  });

  it('shows all scenarios when dropdown is open', () => {
    renderPicker();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Credential Stuffing')).toBeInTheDocument();
    expect(screen.getByText('Insider Threat')).toBeInTheDocument();
  });

  it('closes the dropdown when button is clicked again', () => {
    renderPicker();
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Ransomware Lateral Movement')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText('Ransomware Lateral Movement')).not.toBeInTheDocument();
  });
});

describe('ScenarioPicker — scenario selection', () => {
  it('calls onSelect with the scenario ID when a scenario is clicked', () => {
    const { onSelect } = renderPicker();
    fireEvent.click(screen.getByRole('button')); // open
    fireEvent.click(screen.getByText('Ransomware Lateral Movement'));
    expect(onSelect).toHaveBeenCalledWith('ransomware');
  });

  it('closes the dropdown after a scenario is selected', () => {
    renderPicker();
    fireEvent.click(screen.getByRole('button')); // open
    fireEvent.click(screen.getByText('Ransomware Lateral Movement'));
    expect(screen.queryByText('Credential Stuffing')).not.toBeInTheDocument();
  });

  it('shows indicator dot for the active scenario', () => {
    renderPicker({ activeId: 'supply-chain' });
    fireEvent.click(screen.getByRole('button')); // open
    // The active scenario row has a cyan dot indicator
    const { container } = renderPicker({ activeId: 'supply-chain' });
    fireEvent.click(container.querySelector('button')!);
    expect(container.querySelector('.bg-cyan-400')).toBeInTheDocument();
  });
});

describe('ScenarioPicker — disabled state', () => {
  it('does not open dropdown when disabled', () => {
    renderPicker({ disabled: true });
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Ransomware Lateral Movement')).not.toBeInTheDocument();
  });

  it('button is disabled when disabled prop is true', () => {
    renderPicker({ disabled: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('ScenarioPicker — outside click', () => {
  it('closes the dropdown when clicking outside', () => {
    renderPicker();
    fireEvent.click(screen.getByRole('button')); // open
    expect(screen.getByText('Ransomware Lateral Movement')).toBeInTheDocument();
    fireEvent.mouseDown(document.body); // click outside
    expect(screen.queryByText('Ransomware Lateral Movement')).not.toBeInTheDocument();
  });

  it('stays open when clicking inside the dropdown', () => {
    const { container } = renderPicker();
    fireEvent.click(screen.getByRole('button')); // open
    const dropdown = container.querySelector('.absolute') as HTMLElement;
    fireEvent.mouseDown(dropdown); // click inside
    expect(screen.getByText('Ransomware Lateral Movement')).toBeInTheDocument();
  });
});

describe('ScenarioPicker — scenario icons in dropdown', () => {
  const iconMap: [string, string][] = [
    ['supply-chain', '📦'],
    ['ransomware', '🔐'],
    ['credential-stuffing', '🔑'],
    ['insider-threat', '🕵️'],
  ];

  it.each(iconMap)('scenario %s shows icon %s in dropdown', (id, icon) => {
    renderPicker();
    fireEvent.click(screen.getByRole('button'));
    const icons = screen.getAllByText(icon);
    expect(icons.length).toBeGreaterThan(0);
  });

  it('shows 🔬 fallback icon for an unknown scenario ID inside the dropdown', () => {
    const scenariosWithUnknown = [
      ...SCENARIOS,
      makeScenario('novel-threat', 'Novel Threat'),
    ];
    render(
      <ScenarioPicker
        scenarios={scenariosWithUnknown}
        activeId="supply-chain"
        onSelect={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    // The 'novel-threat' scenario is not in SCENARIO_ICONS, so it gets the 🔬 fallback
    const fallbacks = screen.getAllByText('🔬');
    expect(fallbacks.length).toBeGreaterThan(0);
  });
});
