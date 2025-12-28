import { useRef, useCallback, useEffect } from 'react';
import { SFX_GAIN, clamp, getSpeechLang, MUSIC_BG_CAP, TTS_DUCK_FACTOR, TTS_DUCK_MIN, TTS_DUCK_MAX } from '../StressTest.data';

export const useStressAudio = ({
  soundEnabled, bgMusicEnabled, sfxEnabled, setNewsCaption
}) => {
  const ambientAudio = useRef(null);
  const glitchAudio = useRef(null);
  const devilAudio = useRef(null);
  const strikeAudio = useRef(null);
  const despairAudio = useRef(null);
  const tvZapSfxRef = useRef([]);
  const tvWeirdSfxRef = useRef([]);
  const testSoundAudio = useRef(null);
  
  const tvZapGateRef = useRef({ t: 0 });
  const sfxGateRef = useRef({ t: 0 });
  const ambientDuckRef = useRef({ amb: 0.012, despair: 0.012 });
  
  const musicMixRef = useRef({
    ambVol: 0.012,
    despairVol: 0.012,
    ambPaused: false,
    despairPaused: false
  });

  const newsAudioRef = useRef({
    ambVol: null, despairVol: null, ambRate: null, despairRate: null,
    ambWasPlaying: false, despairWasPlaying: false, prevTvMute: null
  });

  const newsGateRef = useRef({ t: 0, speaking: false });

  const stopAllSfx = useCallback(() => {
    [ambientAudio, glitchAudio, devilAudio, strikeAudio, despairAudio, testSoundAudio].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const safePlay = useCallback((audioRef, volume = 0.25, loop = false, rate = 1, force = false) => {
    if (!audioRef.current) return;
    if (!soundEnabled && !force) return;
    try {
      audioRef.current.volume = volume * SFX_GAIN;
      audioRef.current.loop = loop;
      audioRef.current.playbackRate = rate;
      audioRef.current.play().catch(() => {});
    } catch (_) {}
  }, [soundEnabled]);

  const playSound = useCallback((audioRef, volume = 0.3) => {
    if (!soundEnabled || !sfxEnabled || !audioRef.current) return;
    try {
      audioRef.current.volume = volume * SFX_GAIN;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (_) {}
  }, [soundEnabled, sfxEnabled]);

  const pickNewsVoice = useCallback((mode = 'any') => {
    if (typeof window === 'undefined') return null;
    const voices = window.speechSynthesis.getVoices();
    const en = voices.filter(v => /en/i.test(v.lang));
    if (!en.length) return null;
    if (mode === 'male') {
      const male = en.find(v => /male|david|guy|google us english/i.test(v.name.toLowerCase()));
      return male || en[0];
    }
    if (mode === 'female') {
      const female = en.find(v => /female|zira|samantha|google uk english/i.test(v.name.toLowerCase()));
      return female || en[0];
    }
    return en[Math.floor(Math.random() * en.length)];
  }, []);

  const normalizeTtsText = useCallback((s) => {
    return s.replace(/[^\w\s.,!?-]/gi, '').trim();
  }, []);

  const applyTtsMusicDuck = useCallback((isActive) => {
    if (isActive) {
      if (ambientAudio.current) ambientAudio.current.volume = TTS_DUCK_MIN;
      if (despairAudio.current) despairAudio.current.volume = TTS_DUCK_MIN;
    } else {
      if (ambientAudio.current) ambientAudio.current.volume = musicMixRef.current.ambVol;
      if (despairAudio.current) despairAudio.current.volume = musicMixRef.current.despairVol;
    }
  }, []);

  return {
    ambientAudio, glitchAudio, devilAudio, strikeAudio, despairAudio,
    tvZapSfxRef, tvWeirdSfxRef, testSoundAudio, tvZapGateRef, ambientDuckRef,
    musicMixRef, newsAudioRef, newsGateRef,
    stopAllSfx, safePlay, playSound,
    pickNewsVoice, normalizeTtsText, applyTtsMusicDuck
  };
};

