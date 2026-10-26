import { axisById, type Lang } from './content';
import { t, tx } from './i18n';

export function zoneLabel(lang: Lang, axisId: string | null, zone: string | null) {
  if (zone === 'X' || !zone) return t(lang, 'mixed');
  if (!axisId) return t(lang, zone === 'L' ? 'sideL' : 'sideM');
  const axis = axisById(axisId);
  return tx(lang, zone === 'L' ? axis.leadership : axis.management);
}
