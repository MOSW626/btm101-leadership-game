import { publicHostingEnabled } from '@/lib/hosting';
import { ApiError, check, db, json, readJson, requireAdmin, route } from '@/lib/server';

export const GET = route(async req => {
  requireAdmin(req, false);
  return json({ enabled: await publicHostingEnabled() });
});
export const PATCH = route(async req => {
  requireAdmin(req);
  const body = await readJson(req, 256);
  if (typeof body.enabled !== 'boolean') throw new ApiError(400, 'BAD_SETTING', 'enabled must be a boolean');
  check(await db().from('app_settings').update({ public_hosting_enabled: body.enabled }).eq('singleton', true));
  return json({ enabled: body.enabled });
});
