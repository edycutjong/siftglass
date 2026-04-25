import {
  DEMO_NODES,
  DEMO_EDGES,
  DEMO_AGENT_STATE,
  DEMO_TERMINAL,
  DEMO_SCENARIOS,
} from '@/lib/demo-data';

/* ═══════════════════════════════════════════════════════════════
   Backward-compat exports (scenario 0)
   ═══════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════
   DEMO_SCENARIOS — all 4 scenarios
   ═══════════════════════════════════════════════════════════════ */

describe('DEMO_SCENARIOS', () => {
  it('has exactly 4 scenarios', () => {
    expect(DEMO_SCENARIOS).toHaveLength(4);
  });

  it('scenario IDs are unique', () => {
    const ids = DEMO_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('scenario[0] matches backward-compat exports', () => {
    expect(DEMO_SCENARIOS[0].nodes).toBe(DEMO_NODES);
    expect(DEMO_SCENARIOS[0].edges).toBe(DEMO_EDGES);
    expect(DEMO_SCENARIOS[0].agentState).toBe(DEMO_AGENT_STATE);
    expect(DEMO_SCENARIOS[0].terminal).toBe(DEMO_TERMINAL);
  });

  it.each([
    ['supply-chain'],
    ['ransomware'],
    ['credential-stuffing'],
    ['insider-threat'],
  ])('scenario %s exists', (id) => {
    expect(DEMO_SCENARIOS.find((s) => s.id === id)).toBeDefined();
  });

  describe.each(DEMO_SCENARIOS.map((s) => [s.id, s]))('scenario "%s"', (_id, scenario) => {
    const s = scenario as typeof DEMO_SCENARIOS[number];

    it('has required metadata', () => {
      expect(s.title).toBeDefined();
      expect(s.description).toBeDefined();
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    });

    it('has at least 5 nodes', () => {
      expect(s.nodes.length).toBeGreaterThanOrEqual(5);
    });

    it('node IDs are unique within scenario', () => {
      const ids = s.nodes.map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all node types are valid', () => {
      const valid = new Set(['ip', 'domain', 'hash', 'process', 'file', 'user', 'network']);
      for (const n of s.nodes) expect(valid.has(n.type)).toBe(true);
    });

    it('all node statuses are valid', () => {
      const valid = new Set(['investigating', 'malicious', 'benign', 'shattered']);
      for (const n of s.nodes) expect(valid.has(n.status)).toBe(true);
    });

    it('confidence values are 0-100', () => {
      for (const n of s.nodes) {
        expect(n.confidence).toBeGreaterThanOrEqual(0);
        expect(n.confidence).toBeLessThanOrEqual(100);
      }
    });

    it('edge IDs are unique within scenario', () => {
      const ids = s.edges.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all edge endpoints reference existing nodes', () => {
      const nodeIds = new Set(s.nodes.map((n) => n.id));
      for (const e of s.edges) {
        expect(nodeIds.has(e.source)).toBe(true);
        expect(nodeIds.has(e.target)).toBe(true);
      }
    });

    it('has at least one animated edge', () => {
      expect(s.edges.some((e) => e.animated === true)).toBe(true);
    });

    it('agentState has valid fields', () => {
      expect(s.agentState.objective.length).toBeGreaterThan(0);
      expect(s.agentState.reasoning.length).toBeGreaterThan(0);
      expect(s.agentState.confidence).toBeGreaterThanOrEqual(0);
      expect(s.agentState.confidence).toBeLessThanOrEqual(100);
      expect(['scanning', 'investigating', 'correlating', 'concluded']).toContain(s.agentState.phase);
    });

    it('terminal has at least 10 lines', () => {
      expect(s.terminal.length).toBeGreaterThanOrEqual(10);
    });

    it('terminal line IDs are unique', () => {
      const ids = s.terminal.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('terminal lines have ascending timestamps', () => {
      for (let i = 1; i < s.terminal.length; i++) {
        expect(s.terminal[i].timestamp).toBeGreaterThanOrEqual(s.terminal[i - 1].timestamp);
      }
    });

    it('terminal includes all 5 line types', () => {
      const types = new Set(s.terminal.map((l) => l.type));
      expect(types.size).toBe(5);
    });

    it('every node has a position mapping', () => {
      for (const n of s.nodes) {
        expect(s.positions[n.id]).toBeDefined();
        expect(typeof s.positions[n.id].x).toBe('number');
        expect(typeof s.positions[n.id].y).toBe('number');
      }
    });
  });
});
