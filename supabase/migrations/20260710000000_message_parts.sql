-- Persist structured UI parts alongside assistant message text.
-- Existing rows receive an empty array and remain text-only on read.

alter table public.messages
  add column if not exists parts jsonb not null default '[]'::jsonb;

alter table public.messages
  drop constraint if exists messages_parts_is_array;

alter table public.messages
  add constraint messages_parts_is_array
  check (jsonb_typeof(parts) = 'array');
