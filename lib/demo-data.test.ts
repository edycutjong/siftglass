import {
  DEMO_NODES,
  DEMO_EDGES,
  DEMO_AGENT_STATE,
  DEMO_TERMINAL,
} from '@/lib/demo-data';

describe('DEMO_NODES', () => {
  it('has exactly 7 nodes', () => {
    expect(DEMO_NODES).toHaveLength(7);
  });

  it('every node has required fields', () => {
    for (const node of DEMO_NODES) {
      expect(node.id).toBeDefined();
      expect(node.label).toBeDefined();
      expect(node.type).toBeDefined();
      expect(node.status).toBeDefined();
      expect(typeof node.confidence).toBe('number');
      expect(node.details).toBeDefined();
      expect(typeof node.timestamp).toBe('number');
    }
  });

  it('confidence values are between 0 and 100', () => {
    for (const node of DEMO_NODES) {
      expect(node.confidence).toBeGreaterThanOrEqual(0);
      expect(node.confidence).toBeLessThanOrEqual(100);
    }
  });

  it('all status values are valid NodeStatus literals', () => {
    const valid = new Set(['investigating', 'malicious', 'benign', 'shattered']);
    for (const node of DEMO_NODES) {
      expect(valid.has(node.status)).toBe(true);
    }
  });

  it('all type values are valid InvestigationNode types', () => {
    const valid = new Set(['ip', 'domain', 'hash', 'process', 'file', 'user', 'network']);
    for (const node of DEMO_NODES) {
      expect(valid.has(node.type)).toBe(true);
    }
  });

  it('node IDs are unique', () => {
    const ids = DEMO_NODES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes an ip node', () => {
    expect(DEMO_NODES.some((n) => n.type === 'ip')).toBe(true);
  });

  it('includes a domain node', () => {
    expect(DEMO_NODES.some((n) => n.type === 'domain')).toBe(true);
  });

  it('includes a hash node', () => {
    expect(DEMO_NODES.some((n) => n.type === 'hash')).toBe(true);
  });

  it('includes a process node', () => {
    expect(DEMO_NODES.some((n) => n.type === 'process')).toBe(true);
  });

  it('includes a file node', () => {
    expect(DEMO_NODES.some((n) => n.type === 'file')).toBe(true);
  });

  it('includes a user node', () => {
    expect(DEMO_NODES.some((n) => n.type === 'user')).toBe(true);
  });
});

describe('DEMO_EDGES', () => {
  it('has exactly 7 edges', () => {
    expect(DEMO_EDGES).toHaveLength(7);
  });

  it('every edge has required fields', () => {
    for (const edge of DEMO_EDGES) {
      expect(edge.id).toBeDefined();
      expect(edge.source).toBeDefined();
      expect(edge.target).toBeDefined();
    }
  });

  it('edge IDs are unique', () => {
    const ids = DEMO_EDGES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all edge sources and targets reference existing node IDs', () => {
    const nodeIds = new Set(DEMO_NODES.map((n) => n.id));
    for (const edge of DEMO_EDGES) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });

  it('has at least one animated edge', () => {
    expect(DEMO_EDGES.some((e) => e.animated === true)).toBe(true);
  });

  it('has at least one non-animated edge', () => {
    expect(DEMO_EDGES.some((e) => e.animated === false)).toBe(true);
  });
});

describe('DEMO_AGENT_STATE', () => {
  it('has all required fields', () => {
    expect(DEMO_AGENT_STATE.objective).toBeDefined();
    expect(DEMO_AGENT_STATE.reasoning).toBeDefined();
    expect(typeof DEMO_AGENT_STATE.confidence).toBe('number');
    expect(DEMO_AGENT_STATE.phase).toBeDefined();
  });

  it('confidence is between 0 and 100', () => {
    expect(DEMO_AGENT_STATE.confidence).toBeGreaterThanOrEqual(0);
    expect(DEMO_AGENT_STATE.confidence).toBeLessThanOrEqual(100);
  });

  it('phase is a valid value', () => {
    const valid = new Set(['scanning', 'investigating', 'correlating', 'concluded']);
    expect(valid.has(DEMO_AGENT_STATE.phase)).toBe(true);
  });

  it('currentTool is a string or null', () => {
    expect(
      DEMO_AGENT_STATE.currentTool === null || typeof DEMO_AGENT_STATE.currentTool === 'string'
    ).toBe(true);
  });
});

describe('DEMO_TERMINAL', () => {
  it('has exactly 12 lines', () => {
    expect(DEMO_TERMINAL).toHaveLength(12);
  });

  it('every line has required fields', () => {
    for (const line of DEMO_TERMINAL) {
      expect(line.id).toBeDefined();
      expect(typeof line.timestamp).toBe('number');
      expect(line.type).toBeDefined();
      expect(line.content).toBeDefined();
    }
  });

  it('all type values are valid TerminalLine types', () => {
    const valid = new Set(['info', 'warning', 'error', 'success', 'agent']);
    for (const line of DEMO_TERMINAL) {
      expect(valid.has(line.type)).toBe(true);
    }
  });

  it('line IDs are unique', () => {
    const ids = DEMO_TERMINAL.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lines have ascending timestamps', () => {
    for (let i = 1; i < DEMO_TERMINAL.length; i++) {
      expect(DEMO_TERMINAL[i].timestamp).toBeGreaterThanOrEqual(DEMO_TERMINAL[i - 1].timestamp);
    }
  });

  it('includes all 5 line types', () => {
    const types = new Set(DEMO_TERMINAL.map((l) => l.type));
    expect(types.has('info')).toBe(true);
    expect(types.has('warning')).toBe(true);
    expect(types.has('error')).toBe(true);
    expect(types.has('success')).toBe(true);
    expect(types.has('agent')).toBe(true);
  });
});
