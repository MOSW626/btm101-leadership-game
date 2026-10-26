import { createHash, timingSafeEqual } from 'node:crypto';

/** A room capability is unrelated to participant tokens or global admin access. */
export function ownsRoom(token, storedHash) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  if (typeof storedHash !== 'string' || !/^[a-f0-9]{64}$/.test(storedHash)) return false;
  const actual = createHash('sha256').update(token).digest();
  return timingSafeEqual(actual, Buffer.from(storedHash, 'hex'));
}
