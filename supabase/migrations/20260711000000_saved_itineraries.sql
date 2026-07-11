-- ============ 已保存行程表 ============
create table if not exists public.saved_itineraries (
    id              uuid primary key default gen_random_uuid(),
    user_id         text not null references users(id) on delete cascade,
    conversation_id uuid references conversations(id) on delete set null,
    title           text not null,
    source          text not null
                    check (source in ('nearby','attractions','recommend','itinerary','mixed')),
    items           jsonb not null,
    created_at      timestamptz default now(),
    deleted_at      timestamptz
);

-- ============ 索引 ============
create index if not exists idx_saved_itineraries_user
  on public.saved_itineraries(user_id, created_at desc);

-- ============ RLS ============
alter table public.saved_itineraries enable row level security;

revoke all on table public.saved_itineraries from anon, authenticated;
grant all  on table public.saved_itineraries to service_role;
