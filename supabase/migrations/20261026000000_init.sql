-- 팀플에서 나는 무엇부터 할까? — 방·참가자·제출. 브라우저는 DB에 직접 접근하지 않는다(서버 secret key 전용).

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  title text not null check (char_length(title) between 1 and 80),
  expected_count int check (expected_count > 0),
  status text not null default 'open' check (status in ('open', 'closed')),
  revealed boolean not null default false,
  content_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  unique (id, session_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  participant_id uuid not null,
  group_id text not null check (group_id in ('1', '2', '3', '4', 'other')),
  nickname text check (char_length(nickname) <= 20),
  answers jsonb not null,
  result jsonb not null,
  content_version text not null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, participant_id),
  -- 참가자와 방의 소속 일치를 DB가 강제한다.
  foreign key (participant_id, session_id) references public.participants(id, session_id) on delete cascade
);

create table public.admin_login_failures (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  at timestamptz not null default now()
);
create index on public.admin_login_failures (ip_hash, at);

alter table public.sessions enable row level security;
alter table public.participants enable row level security;
alter table public.submissions enable row level security;
alter table public.admin_login_failures enable row level security;
revoke all on public.sessions, public.participants, public.submissions, public.admin_login_failures from anon, authenticated;

-- 입장: 방 행을 잠그고 open일 때만 참가자 생성. 같은 토큰이 이미 이 방에 있으면 그대로 반환.
create function public.join_session(p_code text, p_token_hash text)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.sessions; pid uuid;
begin
  select * into s from public.sessions where code = p_code for share;
  if not found then raise exception 'NOT_FOUND'; end if;
  select id into pid from public.participants where token_hash = p_token_hash and session_id = s.id;
  if found then return pid; end if;
  if s.status <> 'open' then raise exception 'SESSION_CLOSED'; end if;
  insert into public.participants (session_id, token_hash) values (s.id, p_token_hash) returning id into pid;
  return pid;
end $$;

-- 제출: 방 행을 FOR SHARE로 잠가 동시 마감(UPDATE)과 직렬화하고, open일 때만 upsert.
create function public.upsert_submission(
  p_code text, p_token_hash text, p_group text, p_nickname text,
  p_answers jsonb, p_result jsonb, p_version text
) returns timestamptz language plpgsql security definer set search_path = public as $$
declare s public.sessions; p public.participants; saved timestamptz;
begin
  select * into s from public.sessions where code = p_code for share;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into p from public.participants where token_hash = p_token_hash;
  if not found then raise exception 'BAD_TOKEN'; end if;
  if p.session_id <> s.id then raise exception 'WRONG_SESSION'; end if;
  if s.status <> 'open' then raise exception 'SESSION_CLOSED'; end if;
  if s.content_version <> p_version then raise exception 'VERSION_MISMATCH'; end if;
  insert into public.submissions (session_id, participant_id, group_id, nickname, answers, result, content_version)
  values (s.id, p.id, p_group, p_nickname, p_answers, p_result, p_version)
  on conflict (session_id, participant_id) do update
    set group_id = excluded.group_id, nickname = excluded.nickname, answers = excluded.answers,
        result = excluded.result, content_version = excluded.content_version, updated_at = now()
  returning updated_at into saved;
  return saved;
end $$;

revoke execute on function public.join_session(text, text) from public, anon, authenticated;
revoke execute on function public.upsert_submission(text, text, text, text, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.join_session(text, text) to service_role;
grant execute on function public.upsert_submission(text, text, text, text, jsonb, jsonb, text) to service_role;
