-- Add the target date range for saved itineraries.
-- A single-day plan sets both columns to the same value;
-- a multi-day plan spans the earliest and latest day.
alter table public.saved_itineraries
    add column if not exists start_date date,
    add column if not exists end_date date;
