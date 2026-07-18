-- Upgrade databases that applied the initial welcome-email migration before
-- submitting attempts carried a recoverable lease.

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

comment on column public.welcome_email_deliveries.lease_expires_at is
  'Expired attempts may be reclaimed for at-least-once delivery; a provider-accepted request that crashes before finalization can be sent again.';
