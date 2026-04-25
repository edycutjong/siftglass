-- SIFTGlass: Incident Response Agent Dashboard
-- Tables for investigation nodes, edges, agent state, and terminal logs
-- All tables have Realtime enabled so the frontend can subscribe to live changes

-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────

create type node_type as enum ('ip', 'domain', 'hash', 'process', 'file', 'user', 'network');
create type node_status as enum ('investigating', 'malicious', 'benign', 'shattered');
create type agent_phase as enum ('scanning', 'investigating', 'correlating', 'concluded');
create type terminal_line_type as enum ('info', 'warning', 'error', 'success', 'agent');

-- ─────────────────────────────────────────────────────────────
-- INVESTIGATION_NODES
-- ─────────────────────────────────────────────────────────────

create table investigation_nodes (
  id          text primary key,
  session_id  text not null,
  label       text not null,
  type        node_type not null,
  status      node_status not null default 'investigating',
  confidence  integer not null default 0 check (confidence between 0 and 100),
  details     text not null default '',
  position_x  float not null default 0,
  position_y  float not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table investigation_nodes enable row level security;

-- Anon/frontend can read; service role (Python agent) can write
create policy "Public read" on investigation_nodes for select using (true);
create policy "Service write" on investigation_nodes for insert with check (true);
create policy "Service update" on investigation_nodes for update using (true);
create policy "Service delete" on investigation_nodes for delete using (true);

-- ─────────────────────────────────────────────────────────────
-- INVESTIGATION_EDGES
-- ─────────────────────────────────────────────────────────────

create table investigation_edges (
  id          text primary key,
  session_id  text not null,
  source      text not null references investigation_nodes(id) on delete cascade,
  target      text not null references investigation_nodes(id) on delete cascade,
  label       text,
  animated    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table investigation_edges enable row level security;

create policy "Public read" on investigation_edges for select using (true);
create policy "Service write" on investigation_edges for insert with check (true);
create policy "Service update" on investigation_edges for update using (true);
create policy "Service delete" on investigation_edges for delete using (true);

-- ─────────────────────────────────────────────────────────────
-- AGENT_STATE
-- ─────────────────────────────────────────────────────────────

create table agent_state (
  session_id    text primary key,
  objective     text not null default '',
  reasoning     text not null default '',
  confidence    integer not null default 0 check (confidence between 0 and 100),
  current_tool  text,
  phase         agent_phase not null default 'scanning',
  updated_at    timestamptz not null default now()
);

alter table agent_state enable row level security;

create policy "Public read" on agent_state for select using (true);
create policy "Service write" on agent_state for insert with check (true);
create policy "Service update" on agent_state for update using (true);

-- ─────────────────────────────────────────────────────────────
-- TERMINAL_LINES
-- ─────────────────────────────────────────────────────────────

create table terminal_lines (
  id          text primary key,
  session_id  text not null,
  type        terminal_line_type not null default 'info',
  content     text not null,
  created_at  timestamptz not null default now()
);

alter table terminal_lines enable row level security;

create policy "Public read" on terminal_lines for select using (true);
create policy "Service write" on terminal_lines for insert with check (true);

-- ─────────────────────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────────────────────

drop publication if exists supabase_realtime;
create publication supabase_realtime for table
  investigation_nodes,
  investigation_edges,
  agent_state,
  terminal_lines;

-- ─────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at
-- ─────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_nodes_updated_at
  before update on investigation_nodes
  for each row execute function set_updated_at();

create trigger trg_agent_updated_at
  before update on agent_state
  for each row execute function set_updated_at();
