-- Public hosting is closed by default. An admin can enable it after class.
alter table public.sessions add column host_token_hash text;

create table public.app_settings (
  singleton boolean primary key default true check (singleton),
  public_hosting_enabled boolean not null default false
);
insert into public.app_settings(singleton) values (true);
create table public.host_creation_events (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  at timestamptz not null default now()
);
create index on public.host_creation_events(ip_hash, at);
alter table public.app_settings enable row level security;
alter table public.host_creation_events enable row level security;
revoke all on public.app_settings, public.host_creation_events from anon, authenticated;
grant all on public.app_settings, public.host_creation_events to service_role;
grant usage, select on sequence public.host_creation_events_id_seq to service_role;

create function public.create_hosted_session(
  p_code text, p_title text, p_expected int, p_version text, p_host_hash text, p_ip_hash text
) returns void language plpgsql security definer set search_path = public as $$
declare enabled boolean; recent bigint;
begin
  -- Serializes creation with the admin switch and concurrent requests.
  select public_hosting_enabled into enabled from public.app_settings where singleton = true for update;
  if enabled is distinct from true then raise exception 'HOSTING_CLOSED'; end if;
  select count(*) into recent from public.host_creation_events
    where ip_hash = p_ip_hash and at > now() - interval '1 hour';
  if recent >= 3 then raise exception 'HOST_RATE_LIMIT'; end if;
  insert into public.sessions(code, title, expected_count, content_version, host_token_hash)
    values(p_code, p_title, p_expected, p_version, p_host_hash);
  insert into public.host_creation_events(ip_hash) values(p_ip_hash);
  -- Keep only the window used for abuse prevention; no raw IPs are stored.
  delete from public.host_creation_events where at < now() - interval '1 hour';
end $$;
revoke execute on function public.create_hosted_session(text, text, int, text, text, text) from public, anon, authenticated;
grant execute on function public.create_hosted_session(text, text, int, text, text, text) to service_role;
