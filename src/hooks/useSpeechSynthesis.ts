import { useCallback, useEffect, useState } from 'react';

const LANG_LOCALE_MAP: Record<string, string> = {
  EN: 'en-US',
  DE: 'de-DE',
  ES: 'es-ES',
  FR: 'fr-FR',
  IT: 'it-IT',
  JA: 'ja-JP',
};

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (rawText: string, langCode = 'EN', rate = 0.95) => {
      if (!supported || !rawText.trim()) return;
      const cleanText = rawText.replace(/<[^>]+>/g, '').replace(/\*\*/g, '').trim();
      const locale = LANG_LOCALE_MAP[langCode.toUpperCase()] ?? 'en-US';

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = locale;
      utterance.rate = rate;

      const preferred =
        voices.find((v) => v.lang === locale && /Google|Natural|Aria|Jenny/i.test(v.name)) ||
        voices.find((v) => v.lang === locale) ||
        voices.find((v) => v.lang.startsWith(locale.split('-')[0]));

      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    },
    [supported, voices]
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { speak, stop, supported };
}