-- Saved itineraries: baseline table + target_time (planned visit datetime, NY local ISO).

create table if not exists public.saved_itineraries (
    id              uuid primary key default gen_random_uuid(),
    user_id         text not null,
    conversation_id text,
    title           text not null,
    source          text not null,
    items           jsonb not null default '[]'::jsonb,
    description     text,
    note            text,
    target_time     text,
    created_at      timestamptz default now(),
    deleted_at      timestamptz
);

alter table public.saved_itineraries
    add column if not exists target_time text;

comment on column public.saved_itineraries.target_time is
    'Planned visit datetime in America/New_York local ISO 8601 without offset, e.g. 2026-07-10T16:00:00';

create index if not exists idx_saved_itineraries_user
    on public.saved_itineraries(user_id, created_at desc)
    where deleted_at is null;
