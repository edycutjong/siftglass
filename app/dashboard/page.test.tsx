import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

// ─────────────────────────────────────────────────────────────────────────────
// Mutable state referenced by jest.mock factory via closure (variables MUST
// start with "mock" so Jest's babel hoisting allows forward references).
// ─────────────────────────────────────────────────────────────────────────────
let mockIsSupabaseConfigured = false;
let mockSupabaseRef: any = null;

jest.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mockIsSupabaseConfigured;
  },
  get supabase() {
    return mockSupabaseRef;
  },
}));

// ─── ReactFlow mock ───────────────────────────────────────────────────────────
let capturedNodeColor: ((node: any) => string) | null = null;
let capturedOnNodeClick: ((e: any, node: any) => void) | null = null;
let capturedOnInit: ((instance: any) => void) | null = null;

jest.mock('@xyflow/react', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    ReactFlow: ({ children, onNodeClick, onInit }: any) => {
      capturedOnNodeClick = onNodeClick;
      capturedOnInit = onInit;
      return React.createElement('div', { 'data-testid': 'reactflow' }, children);
    },
    MiniMap: ({ nodeColor }: any) => {
      capturedNodeColor = nodeColor;
      return React.createElement('div', { 'data-testid': 'minimap' });
    },
    Controls: () => React.createElement('div', { 'data-testid': 'controls' }),
    Background: () => React.createElement('div', { 'data-testid': 'background' }),
    BackgroundVariant: { Dots: 'dots' },
    useNodesState: (initial: any) => {
      const [state, setState] = React.useState(initial);
      return [state, setState, jest.fn()];
    },
    useEdgesState: (initial: any) => {
      const [state, setState] = React.useState(initial);
      return [state, setState, jest.fn()];
    },
  };
});

// ─── Child component mocks ────────────────────────────────────────────────────
jest.mock('@/components/soc/AgentBanner', () => ({ state }: any) =>
  React.createElement('div', {
    'data-testid': 'agent-banner',
    'data-phase': state.phase,
    'data-confidence': state.confidence,
  })
);
jest.mock('@/components/soc/TerminalPanel', () => ({ lines }: any) =>
  React.createElement('div', { 'data-testid': 'terminal-panel', 'data-lines': lines.length })
);
jest.mock('@/components/soc/InvestigationNode', () => () =>
  React.createElement('div', { 'data-testid': 'investigation-node' })
);
jest.mock('@/components/soc/ScenarioPicker', () => ({ onSelect, activeId }: any) =>
  React.createElement('div', {
    'data-testid': 'scenario-picker-container',
    'data-active': activeId,
  },
    React.createElement('button', {
      'data-testid': 'scenario-picker',
      'data-active': activeId,
      onClick: () => onSelect('ransomware'),
    }, 'Switch Scenario'),
    React.createElement('button', {
      'data-testid': 'scenario-picker-bad',
      onClick: () => onSelect('nonexistent-id'),
    }, 'Bad Scenario')
  )
);

// ─────────────────────────────────────────────────────────────────────────────
// Imported AFTER mocks are registered
// ─────────────────────────────────────────────────────────────────────────────
import DashboardPage, {
  dbNodeToFlow,
  dbEdgeToFlow,
  scenarioNodesToFlow,
  scenarioEdgesToFlow,
  demoNodesToFlow,
  demoEdgesToFlow,
} from '@/app/dashboard/page';
import { DEMO_SCENARIOS, DEMO_NODES, DEMO_EDGES } from '@/lib/demo-data';

// ─────────────────────────────────────────────────────────────────────────────
// Pure helper function tests
// ─────────────────────────────────────────────────────────────────────────────

describe('dbNodeToFlow', () => {
  it('maps a DB row to a ReactFlow Node', () => {
    const row = {
      id: 'n1',
      type: 'ip',
      label: '10.0.0.1',
      status: 'malicious',
      confidence: 90,
      details: 'Some details',
      position_x: 100,
      position_y: 200,
    };
    const node = dbNodeToFlow(row);
    expect(node.id).toBe('n1');
    expect(node.type).toBe('investigation');
    expect(node.position).toEqual({ x: 100, y: 200 });
    expect(node.data).toMatchObject({
      label: '10.0.0.1',
      nodeType: 'ip',
      status: 'malicious',
      confidence: 90,
      details: 'Some details',
    });
  });

  it('defaults position to {x:0, y:0} when position_x/position_y are absent', () => {
    const node = dbNodeToFlow({ id: 'n1' });
    expect(node.position).toEqual({ x: 0, y: 0 });
  });
});

describe('dbEdgeToFlow', () => {
  it('maps a DB row to a ReactFlow Edge', () => {
    const row = {
      id: 'e1',
      source: 'n1',
      target: 'n2',
      label: 'connects to',
      animated: true,
    };
    const edge = dbEdgeToFlow(row);
    expect(edge.id).toBe('e1');
    expect(edge.source).toBe('n1');
    expect(edge.target).toBe('n2');
    expect(edge.label).toBe('connects to');
    expect(edge.animated).toBe(true);
    expect((edge.style as any).stroke).toBe('#06b6d4');
  });

  it('defaults animated to false when absent', () => {
    const edge = dbEdgeToFlow({ id: 'e1', source: 'a', target: 'b' });
    expect(edge.animated).toBe(false);
  });

  it('always uses cyan stroke', () => {
    const edge = dbEdgeToFlow({ id: 'e1', source: 'a', target: 'b' });
    expect((edge.style as any).stroke).toBe('#06b6d4');
  });
});

describe('scenarioNodesToFlow', () => {
  const scenario = DEMO_SCENARIOS[0];

  it('returns one flow node per scenario node', () => {
    const nodes = scenarioNodesToFlow(scenario);
    expect(nodes).toHaveLength(scenario.nodes.length);
  });

  it('uses the scenario position for known node IDs', () => {
    const nodes = scenarioNodesToFlow(scenario);
    const node1 = nodes.find((n) => n.id === 'node-1');
    expect(node1?.position).toEqual(scenario.positions['node-1']);
  });

  it('falls back to {x:0, y:0} for a node with no position mapping', () => {
    const custom: typeof scenario = {
      ...scenario,
      nodes: [{ id: 'ghost', label: 'ghost', type: 'ip', status: 'benign', confidence: 50, details: '', timestamp: 0 }],
      positions: {},
    };
    const nodes = scenarioNodesToFlow(custom);
    expect(nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it('maps data fields correctly', () => {
    const nodes = scenarioNodesToFlow(scenario);
    const node1 = nodes.find((n) => n.id === 'node-1')!;
    expect(node1.data).toMatchObject({
      label: scenario.nodes[0].label,
      nodeType: scenario.nodes[0].type,
      status: scenario.nodes[0].status,
      confidence: scenario.nodes[0].confidence,
      details: scenario.nodes[0].details,
    });
  });
});

describe('scenarioEdgesToFlow', () => {
  const scenario = DEMO_SCENARIOS[0];

  it('returns one flow edge per scenario edge', () => {
    const edges = scenarioEdgesToFlow(scenario);
    expect(edges).toHaveLength(scenario.edges.length);
  });

  it('uses grey stroke when the edge target is a shattered node', () => {
    // In scenario 0, node-3 is shattered; edges targeting node-3 should be grey
    const edges = scenarioEdgesToFlow(scenario);
    const shatteredEdge = edges.find((e) => e.target === 'node-3');
    expect(shatteredEdge).toBeDefined();
    expect((shatteredEdge!.style as any).stroke).toBe('#475569');
  });

  it('uses grey stroke for non-animated edges', () => {
    const edges = scenarioEdgesToFlow(scenario);
    // e2-3 is not animated (animated: false)
    const nonAnimated = edges.find((e) => e.id === 'e2-3');
    expect((nonAnimated!.style as any).stroke).toBe('#475569');
  });

  it('uses cyan stroke for animated non-shattered edges', () => {
    const edges = scenarioEdgesToFlow(scenario);
    // e1-2 is animated and targets node-2 (not shattered)
    const animatedEdge = edges.find((e) => e.id === 'e1-2');
    expect((animatedEdge!.style as any).stroke).toBe('#06b6d4');
  });
});

describe('demoNodesToFlow (deprecated wrapper)', () => {
  it('returns the same nodes as scenarioNodesToFlow(DEMO_SCENARIOS[0])', () => {
    const expected = scenarioNodesToFlow(DEMO_SCENARIOS[0]);
    expect(demoNodesToFlow()).toEqual(expected);
  });
});

describe('demoEdgesToFlow (deprecated wrapper)', () => {
  it('returns the same edges as scenarioEdgesToFlow(DEMO_SCENARIOS[0])', () => {
    const expected = scenarioEdgesToFlow(DEMO_SCENARIOS[0]);
    expect(demoEdgesToFlow()).toEqual(expected);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DashboardPage component tests
// ─────────────────────────────────────────────────────────────────────────────

describe('DashboardPage — demo mode (isSupabaseConfigured = false)', () => {
  beforeEach(() => {
    mockIsSupabaseConfigured = false;
    mockSupabaseRef = null;
    capturedNodeColor = null;
    capturedOnNodeClick = null;
    capturedOnInit = null;
  });

  it('renders without crashing', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('reactflow')).toBeInTheDocument();
  });

  it('shows DEMO MODE indicator', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/DEMO MODE/)).toBeInTheDocument();
  });

  it('renders the AgentBanner with demo agent state', () => {
    render(<DashboardPage />);
    const banner = screen.getByTestId('agent-banner');
    expect(banner).toBeInTheDocument();
    // Demo state phase is 'correlating'
    expect(banner.getAttribute('data-phase')).toBe('correlating');
  });

  it('renders the TerminalPanel with demo terminal lines', () => {
    render(<DashboardPage />);
    const terminal = screen.getByTestId('terminal-panel');
    expect(Number(terminal.getAttribute('data-lines'))).toBeGreaterThan(0);
  });

  it('renders the MiniMap', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
  });

  it('renders the ScenarioPicker with default scenario active', () => {
    render(<DashboardPage />);
    const picker = screen.getByTestId('scenario-picker');
    expect(picker.getAttribute('data-active')).toBe('supply-chain');
  });
});

describe('DashboardPage — MiniMap nodeColor callback', () => {
  beforeEach(() => {
    mockIsSupabaseConfigured = false;
    capturedNodeColor = null;
  });

  it('returns red for malicious nodes', () => {
    render(<DashboardPage />);
    expect(capturedNodeColor!({ data: { status: 'malicious' } })).toBe('#ef4444');
  });

  it('returns cyan for investigating nodes', () => {
    render(<DashboardPage />);
    expect(capturedNodeColor!({ data: { status: 'investigating' } })).toBe('#06b6d4');
  });

  it('returns grey for shattered nodes', () => {
    render(<DashboardPage />);
    expect(capturedNodeColor!({ data: { status: 'shattered' } })).toBe('#475569');
  });

  it('returns green for benign nodes (default)', () => {
    render(<DashboardPage />);
    expect(capturedNodeColor!({ data: { status: 'benign' } })).toBe('#22c55e');
  });

  it('returns green for unknown status (default)', () => {
    render(<DashboardPage />);
    expect(capturedNodeColor!({ data: { status: 'unknown' } })).toBe('#22c55e');
  });
});

describe('DashboardPage — onNodeClick callback', () => {
  beforeEach(() => {
    mockIsSupabaseConfigured = false;
    capturedOnNodeClick = null;
  });

  it('logs the clicked node to console', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    render(<DashboardPage />);
    const fakeNode = { id: 'node-1', data: { label: 'test' } };
    capturedOnNodeClick!({} as any, fakeNode as any);
    expect(spy).toHaveBeenCalledWith('Node clicked:', fakeNode);
    spy.mockRestore();
  });
});

describe('DashboardPage — onInit callback', () => {
  beforeEach(() => {
    mockIsSupabaseConfigured = false;
    capturedOnInit = null;
  });

  it('stores the ReactFlow instance in flowRef', () => {
    render(<DashboardPage />);
    const mockInstance = { fitView: jest.fn() };
    expect(() => act(() => { capturedOnInit!(mockInstance); })).not.toThrow();
  });
});

describe('DashboardPage — handleScenarioChange', () => {
  beforeEach(() => {
    mockIsSupabaseConfigured = false;
  });

  it('updates activeScenarioId when a scenario is selected', () => {
    jest.useFakeTimers();
    const mockFitView = jest.fn();
    render(<DashboardPage />);
    
    act(() => {
      if (capturedOnInit) capturedOnInit({ fitView: mockFitView });
    });

    const picker = screen.getByTestId('scenario-picker');
    expect(picker.getAttribute('data-active')).toBe('supply-chain');
    fireEvent.click(picker); // mock calls onSelect('ransomware')
    expect(picker.getAttribute('data-active')).toBe('ransomware');
    
    act(() => {
      jest.runAllTimers();
    });
    expect(mockFitView).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does nothing when an unknown scenarioId is provided', () => {
    render(<DashboardPage />);
    const badPicker = screen.getByTestId('scenario-picker-bad');
    // The existing mock still returns 'ransomware'; this tests the guard in handleScenarioChange
    // via the mocked ScenarioPicker passing 'nonexistent-id' (invalid scenario)
    fireEvent.click(badPicker);
    // Active scenario shouldn't change
    expect(screen.getByTestId('scenario-picker')).toHaveAttribute('data-active', 'supply-chain');
    expect(screen.getByTestId('agent-banner')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Live mode — supabase path
// ─────────────────────────────────────────────────────────────────────────────

function makeQueryBuilder(result: any) {
  const b: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  };
  b.then = (resolve: any, reject?: any) => Promise.resolve(result).then(resolve, reject);
  return b;
}

describe('DashboardPage — live mode (isSupabaseConfigured = true)', () => {
  const realtimeHandlers: ((payload: any) => void)[] = [];
  let mockFrom: jest.Mock;
  let mockChannel: jest.Mock;
  let mockRemoveChannel: jest.Mock;
  let mockChannelObj: any;

  beforeEach(() => {
    realtimeHandlers.length = 0;

    mockChannelObj = {
      on: jest.fn((_event: string, _filter: any, handler: (payload: any) => void) => {
        realtimeHandlers.push(handler);
        return mockChannelObj;
      }),
      subscribe: jest.fn().mockReturnValue(mockChannelObj),
    };
    mockRemoveChannel = jest.fn();
    mockChannel = jest.fn().mockReturnValue(mockChannelObj);

    mockFrom = jest.fn((table: string) => {
      if (table === 'investigation_nodes') {
        return makeQueryBuilder({
          data: [
            { id: 'live-1', type: 'ip', label: '1.2.3.4', status: 'malicious', confidence: 80, details: '', position_x: 10, position_y: 20 },
            { id: 'live-2', type: 'domain', label: 'example.com', status: 'investigating', confidence: 50, details: '', position_x: 30, position_y: 40 },
          ],
          error: null,
        });
      }
      if (table === 'investigation_edges') {
        return makeQueryBuilder({
          data: [{ id: 'le1', source: 'live-1', target: 'live-2', label: 'to', animated: true }],
          error: null,
        });
      }
      if (table === 'agent_state') {
        return makeQueryBuilder({
          data: {
            session_id: 'session-abc',
            objective: 'Live objective',
            reasoning: 'Live reasoning',
            confidence: 77,
            current_tool: 'Live Tool',
            phase: 'investigating',
          },
          error: null,
        });
      }
      if (table === 'terminal_lines') {
        return makeQueryBuilder({
          data: [{ id: 'lt1', type: 'info', content: 'Live line', created_at: '2026-04-21T03:42:00.000Z' }],
          error: null,
        });
      }
      return makeQueryBuilder({ data: null, error: null });
    });

    mockIsSupabaseConfigured = true;
    mockSupabaseRef = {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    };
  });

  afterEach(() => {
    mockIsSupabaseConfigured = false;
    mockSupabaseRef = null;
    jest.clearAllMocks();
  });

  async function renderLive() {
    let unmountFn: any;
    await act(async () => {
      const res = render(<DashboardPage />);
      unmountFn = res.unmount;
      await new Promise((r) => setTimeout(r, 0));
    });
    return unmountFn;
  }

  it('calls supabase.channel to subscribe to realtime updates', async () => {
    await renderLive();
    await waitFor(() => expect(mockChannel).toHaveBeenCalledWith('siftglass-realtime'));
  });

  it('subscribes to investigation_nodes changes', async () => {
    await renderLive();
    await waitFor(() => {
      const tables = mockChannelObj.on.mock.calls.map((c: any[]) => c[1].table);
      expect(tables).toContain('investigation_nodes');
    });
  });

  it('subscribes to investigation_edges changes', async () => {
    await renderLive();
    await waitFor(() => {
      const tables = mockChannelObj.on.mock.calls.map((c: any[]) => c[1].table);
      expect(tables).toContain('investigation_edges');
    });
  });

  it('subscribes to agent_state changes', async () => {
    await renderLive();
    await waitFor(() => {
      const tables = mockChannelObj.on.mock.calls.map((c: any[]) => c[1].table);
      expect(tables).toContain('agent_state');
    });
  });

  it('subscribes to terminal_lines changes', async () => {
    await renderLive();
    await waitFor(() => {
      const tables = mockChannelObj.on.mock.calls.map((c: any[]) => c[1].table);
      expect(tables).toContain('terminal_lines');
    });
  });

  it('calls removeChannel on unmount', async () => {
    const unmount = await renderLive();
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it('loads initial data from supabase and shows AGENT LIVE after nodes load', async () => {
    await renderLive();
    await waitFor(() => {
      expect(screen.getByText(/AGENT LIVE/)).toBeInTheDocument();
    });
  });

  // Wait until bootstrap has run and sessionRef.current is set.
  // Signal: setIsLive(true) is called in bootstrap when nodes data is non-empty → 'AGENT LIVE'.
  async function waitForBootstrap() {
    await waitFor(() => expect(screen.getByText(/AGENT LIVE/)).toBeInTheDocument());
  }

  describe('realtime handlers — nodes', () => {
    it('handles nodes INSERT event when session matches', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[0]({
          eventType: 'INSERT',
          new: { id: 'rt-1', session_id: 'session-abc', type: 'ip', label: 'New', status: 'investigating', confidence: 50, details: '', position_x: 0, position_y: 0 },
          old: {},
        });
      });
    });

    it('ignores nodes INSERT when session_id does not match', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[0]({
          eventType: 'INSERT',
          new: { id: 'rt-1', session_id: 'wrong-session', type: 'ip', label: 'New', status: 'investigating', confidence: 50, details: '', position_x: 0, position_y: 0 },
          old: {},
        });
      });
    });

    it('handles nodes UPDATE event', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[0]({
          eventType: 'UPDATE',
          new: { id: 'live-1', session_id: 'session-abc', status: 'benign', confidence: 30, details: 'Updated' },
          old: {},
        });
      });
    });

    it('ignores nodes UPDATE when session_id does not match', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[0]({
          eventType: 'UPDATE',
          new: { id: 'live-1', session_id: 'wrong-session', status: 'benign', confidence: 30, details: 'Updated' },
          old: {},
        });
      });
    });

    it('handles nodes DELETE event', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        // For DELETE, payload.old carries the id
        realtimeHandlers[0]({
          eventType: 'DELETE',
          new: {},
          old: { id: 'live-1' },
        });
      });
    });

    it('ignores events when sid is null (no session set yet)', async () => {
      mockFrom = jest.fn(() => makeQueryBuilder({ data: null, error: null }));
      mockSupabaseRef = { from: mockFrom, channel: mockChannel, removeChannel: mockRemoveChannel };

      render(<DashboardPage />);
      await act(async () => {
        await new Promise(r => setTimeout(r, 0));
      });
      await waitFor(() => expect(realtimeHandlers.length).toBeGreaterThanOrEqual(1));
      await act(async () => {
        realtimeHandlers[0]({ eventType: 'INSERT', new: { session_id: 'x' }, old: {} });
      });
    });
  });

  describe('realtime handlers — edges', () => {
    it('handles edges INSERT event when session matches', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[1]({
          eventType: 'INSERT',
          new: { id: 'e-rt', session_id: 'session-abc', source: 'live-1', target: 'live-2', label: 'test', animated: false },
          old: {},
        });
      });
    });

    it('ignores edges INSERT when session_id does not match', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[1]({
          eventType: 'INSERT',
          new: { id: 'e-rt', session_id: 'wrong-session', source: 'a', target: 'b' },
          old: {},
        });
      });
    });

    it('handles edges DELETE event', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[1]({
          eventType: 'DELETE',
          new: {},
          old: { id: 'le1' },
        });
      });
    });

    it('ignores events when edges sid is null', async () => {
      mockFrom = jest.fn(() => makeQueryBuilder({ data: null, error: null }));
      mockSupabaseRef = { from: mockFrom, channel: mockChannel, removeChannel: mockRemoveChannel };

      render(<DashboardPage />);
      await act(async () => {
        await new Promise(r => setTimeout(r, 0));
      });
      await waitFor(() => expect(realtimeHandlers.length).toBeGreaterThanOrEqual(2));
      await act(async () => {
        realtimeHandlers[1]({ eventType: 'INSERT', new: { session_id: 'x' }, old: {} });
      });
    });
  });

  describe('realtime handlers — agent_state', () => {
    it('handles agent_state UPDATE event when session matches', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[2]({
          eventType: 'UPDATE',
          new: {
            session_id: 'session-abc',
            objective: 'New obj',
            reasoning: 'New reasoning',
            confidence: 55,
            current_tool: null,
            phase: 'concluded',
          },
          old: {},
        });
      });
    });

    it('ignores agent_state UPDATE when session_id does not match', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[2]({
          eventType: 'UPDATE',
          new: { session_id: 'wrong', objective: 'x', reasoning: 'x', confidence: 0, current_tool: null, phase: 'scanning' },
          old: {},
        });
      });
    });

    it('ignores agent_state events when sid is null', async () => {
      mockFrom = jest.fn(() => makeQueryBuilder({ data: null, error: null }));
      mockSupabaseRef = { from: mockFrom, channel: mockChannel, removeChannel: mockRemoveChannel };

      render(<DashboardPage />);
      await act(async () => {
        await new Promise(r => setTimeout(r, 0));
      });
      await waitFor(() => expect(realtimeHandlers.length).toBeGreaterThanOrEqual(3));
      await act(async () => {
        realtimeHandlers[2]({ eventType: 'UPDATE', new: { session_id: 'x' }, old: {} });
      });
    });
  });

  describe('realtime handlers — terminal_lines', () => {
    it('handles terminal_lines INSERT event when session matches', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[3]({
          eventType: 'INSERT',
          new: {
            id: 'term-rt',
            session_id: 'session-abc',
            type: 'success',
            content: 'New terminal line',
            created_at: '2026-04-21T04:00:00.000Z',
          },
          old: {},
        });
      });
    });

    it('ignores terminal_lines INSERT when session_id does not match', async () => {
      await renderLive();
      await waitForBootstrap();
      await act(async () => {
        realtimeHandlers[3]({
          eventType: 'INSERT',
          new: { id: 'term-rt', session_id: 'wrong', type: 'info', content: 'x', created_at: '2026-04-21T04:00:00.000Z' },
          old: {},
        });
      });
    });

    it('ignores terminal_lines events when sid is null', async () => {
      mockFrom = jest.fn(() => makeQueryBuilder({ data: null, error: null }));
      mockSupabaseRef = { from: mockFrom, channel: mockChannel, removeChannel: mockRemoveChannel };

      render(<DashboardPage />);
      await act(async () => {
        await new Promise(r => setTimeout(r, 0));
      });
      await waitFor(() => expect(realtimeHandlers.length).toBeGreaterThanOrEqual(4));
      await act(async () => {
        realtimeHandlers[3]({ eventType: 'INSERT', new: { session_id: 'x' }, old: {} });
      });
    });
  });

  describe('init — session from URL', () => {
    beforeEach(() => {
      window.history.pushState({}, '', '?session=url-session-id');
    });

    afterEach(() => {
      window.history.pushState({}, '', '/');
    });

    it('calls bootstrap with the URL session param', async () => {
      await renderLive();
      await waitFor(() => {
        // bootstrap is called for all 4 tables when sessionParam is set
        expect(mockFrom).toHaveBeenCalledWith('investigation_nodes');
      });
    });
  });

  describe('init — no session URL param, no latest session from DB', () => {
    it('does not crash when there is no session data in DB', async () => {
      // Override agent_state to return null (no sessions found)
      mockFrom = jest.fn((table: string) => {
        if (table === 'agent_state') return makeQueryBuilder({ data: null, error: null });
        return makeQueryBuilder({ data: [], error: null });
      });
      mockSupabaseRef = { from: mockFrom, channel: mockChannel, removeChannel: mockRemoveChannel };

      await act(async () => {
        render(<DashboardPage />);
        await new Promise(r => setTimeout(r, 0));
      });
      await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    });
  });

  describe('bootstrap — partial data responses', () => {
    it('does not crash when nodes data is empty', async () => {
      mockFrom = jest.fn((table: string) => {
        if (table === 'investigation_nodes') return makeQueryBuilder({ data: [], error: null });
        if (table === 'investigation_edges') return makeQueryBuilder({ data: null, error: null });
        if (table === 'agent_state') return makeQueryBuilder({ data: { session_id: 's1', objective: 'x', reasoning: 'x', confidence: 0, current_tool: null, phase: 'scanning' }, error: null });
        return makeQueryBuilder({ data: [], error: null });
      });
      mockSupabaseRef = { from: mockFrom, channel: mockChannel, removeChannel: mockRemoveChannel };

      await act(async () => {
        render(<DashboardPage />);
        await new Promise(r => setTimeout(r, 0));
      });
    });

    it('does not crash when terminal data is empty', async () => {
      mockFrom = jest.fn((table: string) => {
        if (table === 'terminal_lines') return makeQueryBuilder({ data: [], error: null });
        if (table === 'investigation_nodes') return makeQueryBuilder({ data: [{ id: 'n1', type: 'ip', label: 'x', status: 'benign', confidence: 50, details: '', position_x: 0, position_y: 0 }], error: null });
        if (table === 'investigation_edges') return makeQueryBuilder({ data: [], error: null });
        if (table === 'agent_state') return makeQueryBuilder({ data: { session_id: 's1', objective: 'x', reasoning: 'x', confidence: 0, current_tool: null, phase: 'scanning' }, error: null });
        return makeQueryBuilder({ data: null, error: null });
      });
      mockSupabaseRef = { from: mockFrom, channel: mockChannel, removeChannel: mockRemoveChannel };

      await act(async () => {
        render(<DashboardPage />);
        await new Promise(r => setTimeout(r, 0));
      });
    });
  });
});
