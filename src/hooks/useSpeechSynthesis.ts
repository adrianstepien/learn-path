import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveSpeechLocale } from './useSpeechRecognition';

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<number | null>(null);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    utteranceRef.current = null;
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
  }, [supported]);

  const speak = useCallback(
    (rawText: string, langCode = 'EN', rate = 0.95) => {
      if (!supported || !rawText.trim()) return;
      const cleanText = rawText.replace(/<[^>]+>/g, '').replace(/\*\*/g, '').trim();
      const locale = resolveSpeechLocale(langCode, 'en-US');
      const target = locale.toLowerCase();
      const shortLang = target.split('-')[0];

      const availableVoices =
        voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      const norm = (lang: string) => lang.replace('_', '-').toLowerCase();

      const preferred =
        availableVoices.find(
          (v) =>
            norm(v.lang) === target &&
            v.localService &&
            /Google|Natural|Aria|Jenny/i.test(v.name)
        ) ||
        availableVoices.find((v) => norm(v.lang) === target && v.localService) ||
        availableVoices.find((v) => norm(v.lang) === target) ||
        availableVoices.find((v) => norm(v.lang).startsWith(shortLang) && v.localService) ||
        availableVoices.find((v) => norm(v.lang).startsWith(shortLang));

      const startSpeaking = () => {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = locale;
        utterance.rate = rate;
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => {
          utteranceRef.current = null;
        };
        utterance.onerror = (e) => {
          console.warn('TTS error:', e.error);
          utteranceRef.current = null;
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      };

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        timerRef.current = window.setTimeout(startSpeaking, 60);
      } else {
        startSpeaking();
      }
    },
    [supported, voices]
  );

  return { speak, stop, supported };
}