/** Legacy preset prefix stored in DB (`avatar_url`) — UI no longer offers presets; upload a photo instead. */
export const PRESET_AVATAR_PREFIX = 'preset:';

/** Allowed ids (sync with backend PATCH avatarPreset if still used). */
export const AVATAR_PRESET_IDS = [
  'svg-0',
  'svg-1',
  'svg-2',
  'svg-3',
  'svg-4',
  'svg-5',
  'svg-6',
  'svg-7',
];

export function getProfileInitials(username, email) {
  const u = (username || '').trim();
  if (u.length >= 1) {
    const parts = u.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    }
    return u.slice(0, 2).toUpperCase();
  }
  const e = (email || '').trim();
  if (e.length >= 2) return e.slice(0, 2).toUpperCase();
  return '?';
}

export function isPresetAvatarValue(avatar) {
  return typeof avatar === 'string' && avatar.trim().startsWith(PRESET_AVATAR_PREFIX);
}

/** @returns {string|null} e.g. 'svg-3' */
export function parsePresetAvatarId(avatar) {
  if (typeof avatar !== 'string') return null;
  const s = avatar.trim();
  if (!s.startsWith(PRESET_AVATAR_PREFIX)) return null;
  const id = s.slice(PRESET_AVATAR_PREFIX.length);
  return AVATAR_PRESET_IDS.includes(id) ? id : null;
}

export function presetValueFromId(presetId) {
  if (!AVATAR_PRESET_IDS.includes(presetId)) return null;
  return `${PRESET_AVATAR_PREFIX}${presetId}`;
}
