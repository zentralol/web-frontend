-- Add planned visit datetime to existing saved_itineraries table.

alter table public.saved_itineraries
    add column if not exists target_time text;

comment on column public.saved_itineraries.target_time is
    'Planned visit datetime in America/New_York local ISO 8601 without offset, e.g. 2026-07-10T16:00:00';
