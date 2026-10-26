import { randomInt } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { ApiError, bearer, check, db, getSession, isAdmin, json, readJson, requireSameOrigin } from './server';

import { ownsRoom } from './host-permission.mjs';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const roomCode = () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
export function roomInput(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 80) throw new ApiError(400, 'BAD_TITLE', 'Title must be 1-80 characters');
  const expected = body.expectedCount == null || body.expectedCount === '' ? null : Number(body.expectedCount);
  if (expected !== null && !(Number.isInteger(expected) && expected > 0 && expected < 1000))
    throw new ApiError(400, 'BAD_EXPECTED', 'Expected count must be a positive integer');
  return { title, expected };
}
export async function publicHostingEnabled() {
  const settings = check(await db().from('app_settings').select('public_hosting_enabled').eq('singleton', true).single());
  return settings?.public_hosting_enabled === true;
}
export function canManageRoom(req: NextRequest, session: { host_token_hash?: string | null }) {
  if (isAdmin(req)) return true;
  const token = bearer(req);
  return ownsRoom(token, session.host_token_hash);
}
export function requireRoomManager(req: NextRequest, session: { host_token_hash?: string | null }, mutating = false) {
  if (mutating) requireSameOrigin(req);
  if (!canManageRoom(req, session)) throw new ApiError(401, 'HOST_REQUIRED', 'This room requires its host key or admin login');
}
export async function patchRoom(req: NextRequest, code: string) {
  const session = await getSession(code);
  requireRoomManager(req, session, true);
  const body = await readJson(req, 1024);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) {
    if (body.status !== 'open' && body.status !== 'closed') throw new ApiError(400, 'BAD_STATUS', 'Invalid status');
    patch.status = body.status;
  }
  if (body.revealed !== undefined) {
    if (typeof body.revealed !== 'boolean') throw new ApiError(400, 'BAD_REVEALED', 'Invalid revealed flag');
    patch.revealed = body.revealed;
  }
  // The UPDATE locks the same session row as the submission RPC.
  const row = check(await db().from('sessions').update(patch).eq('id', session.id).select('status, revealed, updated_at').single());
  return json({ code: session.code, ...row });
}
