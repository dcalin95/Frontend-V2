const DEX_SETTINGS_STORAGE_KEY = 'dex_settings';

const SOUND_PATHS = {
  confirm: '/audio/dex-confirm.wav',
  alert: '/audio/dex-alert.wav',
};

const DEFAULT_SOUND_SETTINGS = {
  soundEnabled: true,
  soundVolume: 0.7,
};

const FEEDBACK_SOUND_TYPES = {
  success: 'confirm',
  error: 'alert',
  warning: 'alert',
};

const readStoredSoundSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_SOUND_SETTINGS;
  try {
    const raw = window.localStorage.getItem(DEX_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SOUND_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      soundEnabled: typeof parsed.soundEnabled === 'boolean'
        ? parsed.soundEnabled
        : DEFAULT_SOUND_SETTINGS.soundEnabled,
      soundVolume: Number.isFinite(Number(parsed.soundVolume))
        ? Math.min(1, Math.max(0, Number(parsed.soundVolume)))
        : DEFAULT_SOUND_SETTINGS.soundVolume,
    };
  } catch (_) {
    return DEFAULT_SOUND_SETTINGS;
  }
};

export const playDexSound = (type = 'confirm', overrideSettings = null) => {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  const settings = overrideSettings || readStoredSoundSettings();
  if (!settings.soundEnabled) return;

  const src = SOUND_PATHS[type] || SOUND_PATHS.confirm;
  try {
    const audio = new Audio(src);
    audio.volume = Math.min(1, Math.max(0, Number(settings.soundVolume ?? DEFAULT_SOUND_SETTINGS.soundVolume)));
    const result = audio.play();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  } catch (_) {}
};

export const playDexFeedbackSound = (feedbackType, overrideSettings = null) => {
  const soundType = FEEDBACK_SOUND_TYPES[feedbackType];
  if (!soundType) return;
  playDexSound(soundType, overrideSettings);
};

export const playDexToastSound = (toastLike = {}, overrideSettings = null) => {
  playDexFeedbackSound(toastLike?.type, overrideSettings);
};

export default playDexSound;
