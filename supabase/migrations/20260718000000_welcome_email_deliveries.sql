-- Persist welcome-email state so Clerk webhook retries stay coordinated and recoverable.

create table if not exists public.welcome_email_deliveries (
    id              uuid primary key default gen_random_uuid(),
    clerk_user_id   text not null,
    email_kind      text not null default 'welcome',
    recipient       text not null,
    status          text not null default 'reserved',
    attempt_count   integer not null default 1,
    reservation_token uuid not null default gen_random_uuid(),
    last_error      text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    submitted_at     timestamptz,
    lease_expires_at timestamptz default (now() + interval '10 minutes'),

    constraint welcome_email_deliveries_user_kind_key
      unique (clerk_user_id, email_kind),
    constraint welcome_email_deliveries_clerk_user_id_check
      check (
        clerk_user_id = btrim(clerk_user_id)
        and char_length(clerk_user_id) between 1 and 255
      ),
    constraint welcome_email_deliveries_email_kind_check
      check (email_kind = 'welcome'),
    constraint welcome_email_deliveries_recipient_check
      check (
        recipient = btrim(recipient)
        and char_length(recipient) between 3 and 320
        and recipient ~ '^[^[:space:]@]+@[^[:space:]@]+$'
      ),
    constraint welcome_email_deliveries_status_check
      check (status in ('reserved', 'submitting', 'submitted', 'failed', 'unknown')),
    constraint welcome_email_deliveries_attempt_count_check
      check (attempt_count >= 1),
    constraint welcome_email_deliveries_submitted_at_check
      check (
        (status = 'submitted' and submitted_at is not null)
        or (status <> 'submitted' and submitted_at is null)
      )
);

-- Rebuild the lease constraint so this migration also upgrades databases where
-- the initial PR SQL was applied before submitting attempts became reclaimable.
alter table public.welcome_email_deliveries
  drop constraint if exists welcome_email_deliveries_lease_check;

update public.welcome_email_deliveries
set lease_expires_at = now() + interval '10 minutes'
where status = 'submitting' and lease_expires_at is null;

alter table public.welcome_email_deliveries
  add constraint welcome_email_deliveries_lease_check
  check (
    (status in ('reserved', 'submitting') and lease_expires_at is not null)
    or (status not in ('reserved', 'submitting') and lease_expires_at is null)
  );

comment on table public.welcome_email_deliveries is
  'Service-only retry coordination and submission audit state for Clerk welcome emails.';

comment on column public.welcome_email_deliveries.status is
  'reserved before external I/O; submitting while MXroute outcome is not durable; submitted after acceptance; unknown when MXroute outcome is indeterminate.';

comment on column public.welcome_email_deliveries.reservation_token is
  'Database fencing token for one attempt; MXroute does not consume this as an idempotency key.';

comment on column public.welcome_email_deliveries.submitted_at is
  'Time MXroute accepted the request; this does not prove recipient delivery.';

comment on column public.welcome_email_deliveries.lease_expires_at is
  'Expired attempts may be reclaimed for at-least-once delivery; a provider-accepted request that crashes before finalization can be sent again.';

create index if not exists idx_welcome_email_deliveries_unresolved
  on public.welcome_email_deliveries (status, lease_expires_at, updated_at)
  where status in ('reserved', 'submitting', 'failed', 'unknown');

create or replace function public.set_welcome_email_delivery_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_set_welcome_email_delivery_updated_at
  on public.welcome_email_deliveries;

create trigger trg_set_welcome_email_delivery_updated_at
before update on public.welcome_email_deliveries
for each row
execute function public.set_welcome_email_delivery_updated_at();

alter table public.welcome_email_deliveries enable row level security;
alter table public.welcome_email_deliveries force row level security;

revoke all on table public.welcome_email_deliveries from public, anon, authenticated;
grant all on table public.welcome_email_deliveries to service_role;
