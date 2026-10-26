'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Result } from './brief/scoring.mjs';

export const DEMO = 'DEMO';

// 방별 로컬 상태. 토큰·응답·진행 위치·저장 상태를 담고, 언어와는 독립이다.
export interface Room {
  token?: string;
  answers: Record<string, number>;
  idx: number;
  group?: string;
  nickname?: string;
  save?: 'saved' | 'failed' | 'closed';
  savedSig?: string;   // 서버에 저장된 {answers, group, nickname}
  savedAt?: string;
  serverResult?: Result;
  closedShowingSaved?: boolean;
}
const key = (code: string) => `lg:room:${code}`;
export function loadRoom(code: string): Room {
  try { return { answers: {}, idx: 0, ...JSON.parse(localStorage.getItem(key(code)) || '{}') }; } catch { return { answers: {}, idx: 0 }; }
}
export function storeRoom(code: string, room: Room) {
  try { localStorage.setItem(key(code), JSON.stringify(room)); } catch {}
}
export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  // localStorage는 마운트 후에만 읽을 수 있다(SSR 하이드레이션 불일치 방지).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setRoom(loadRoom(code)); }, [code]);
  const update = useCallback((patch: Partial<Room>) => {
    setRoom(prev => { const next = { ...(prev ?? loadRoom(code)), ...patch }; storeRoom(code, next); return next; });
  }, [code]);
  return [room, update] as const;
}
export const sigOf = (r: Pick<Room, 'answers' | 'group' | 'nickname'>) =>
  JSON.stringify([Object.entries(r.answers).sort(), r.group, (r.nickname ?? '').trim() || null]);

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string };
export async function api<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<ApiResult<T>> {
  const { token, ...rest } = init;
  try {
    const res = await fetch(path, {
      ...rest, cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...rest.headers },
    });
    const body = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: body as T };
    return { ok: false, status: res.status, code: body?.error?.code ?? 'SERVER_UNAVAILABLE' };
  } catch {
    return { ok: false, status: 0, code: 'NETWORK' };
  }
}

// 5초 폴링. 숨긴 탭에서는 멈추고 돌아오면 즉시 갱신. 실패해도 직전 값을 유지한다.
export function usePoll<T>(path: string | null, token?: string) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const [at, setAt] = useState<Date | null>(null);
  const tickRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!path) return;
    let alive = true, timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      clearTimeout(timer);
      const r = await api<T>(path, { token });
      if (!alive) return;
      if (r.ok) { setData(r.data); setFailed(false); setAt(new Date()); } else setFailed(true);
      if (!document.hidden) timer = setTimeout(tick, 5000);
    };
    tickRef.current = tick;
    const onVis = () => { if (!document.hidden) tick(); else clearTimeout(timer); };
    document.addEventListener('visibilitychange', onVis);
    tick();
    return () => { alive = false; clearTimeout(timer); document.removeEventListener('visibilitychange', onVis); };
  }, [path, token]);
  return { data, failed, at, reload: () => tickRef.current() };
}

export function errorKey(code: string) {
  return ({ HOST_REQUIRED: 'invalidHostKey', HOSTING_CLOSED: 'hostingClosed', HOST_RATE_LIMIT: 'hostRateLimit', NOT_FOUND: 'notFound', NETWORK: 'network', DB_NOT_CONFIGURED: 'dbNotConfigured', VERSION_MISMATCH: 'versionMismatch', SESSION_CLOSED: 'roomClosed' } as const)[code] ?? 'serverError';
}


// A host key only controls the room it was issued for; it is never placed in a URL.
export function loadHostKey(code: string) {
  try { return localStorage.getItem(`lg:host:${code}`) ?? ''; } catch { return ''; }
}
export function storeHostKey(code: string, token: string) {
  localStorage.setItem(`lg:host:${code}`, token);
}
