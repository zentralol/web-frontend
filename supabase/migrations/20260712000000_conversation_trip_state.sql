-- Agent-managed session state for multi-day trip planning.
-- The agent service-role user reads/writes this column; it is not exposed to the frontend.
alter table public.conversations
    add column if not exists trip_state jsonb;

comment on column public.conversations.trip_state is
    'Agent-managed session state for multi-day trip planning.';
