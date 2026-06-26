-- ============ 1. 会话表 ============
create table if not exists public.conversations (
    id          uuid primary key default gen_random_uuid(),
    user_id     text not null references users(id) on delete cascade,
    title       text,
    model       text,
    created_at  timestamptz default now(),
    updated_at  timestamptz default now(),
    deleted_at  timestamptz
);

-- ============ 2. 消息表 ============
create table if not exists public.messages (
    id                uuid primary key default gen_random_uuid(),
    conversation_id   uuid not null references conversations(id) on delete cascade,
    role              text not null check (role in ('user','assistant','system')),
    content           text not null,
    model             text,
    prompt_tokens     integer,
    completion_tokens integer,
    metadata          jsonb,
    created_at        timestamptz default now(),
    deleted_at        timestamptz
);

-- ============ 3. 索引 ============
create index if not exists idx_conversations_user
  on public.conversations(user_id, updated_at desc);

create index if not exists idx_messages_conversation
  on public.messages(conversation_id, created_at);

-- ============ 4. RLS ============
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on table public.conversations, public.messages from anon, authenticated;
grant all on table public.conversations, public.messages to service_role;

-- ============ 5. 自动更新会话 updated_at ============
create or replace function public.bump_conversation_updated_at()
returns trigger as $$
begin
    update public.conversations
    set updated_at = now()
    where id = new.conversation_id;
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_bump_conversation on public.messages;

create trigger trg_bump_conversation
after insert on public.messages
for each row
execute function public.bump_conversation_updated_at();
