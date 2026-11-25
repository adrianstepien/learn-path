import { useCallback, useEffect, useRef, useState } from 'react';

export const SPEECH_LOCALE_MAP: Record<string, string> = {
  PL: 'pl-PL',
  EN: 'en-US',
  DE: 'de-DE',
  ES: 'es-ES',
  FR: 'fr-FR',
  IT: 'it-IT',
  JA: 'ja-JP',
};

export const resolveSpeechLocale = (langCode: string, fallback = 'en-US') =>
  SPEECH_LOCALE_MAP[langCode.toUpperCase()] ?? fallback;

interface UseSpeechRecognitionOptions {
  lang: string;
  onFinalResult: (transcript: string) => void;
  onError?: (message: string) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Brak dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.',
  'audio-capture': 'Nie wykryto mikrofonu.',
  network: 'Błąd sieci usługi rozpoznawania mowy (w Brave bywa zablokowana).',
  'no-speech': 'Nie wykryto mowy.',
};

export function useSpeechRecognition({
  lang,
  onFinalResult,
  onError,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const onFinalRef = useRef(onFinalResult);
  const onErrorRef = useRef(onError);
  onFinalRef.current = onFinalResult;
  onErrorRef.current = onError;

  const SpeechRecognitionApi =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const supported = Boolean(SpeechRecognitionApi);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const cancel = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognitionApi) return;
    cancel();

    const recognition = new SpeechRecognitionApi();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recognition.onresult = (event: any) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += text;
        } else {
          interimChunk += text;
        }
      }

      setInterimTranscript(interimChunk);
      if (finalChunk.trim()) {
        onFinalRef.current(finalChunk.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        onErrorRef.current?.(
          ERROR_MESSAGES[event.error] ?? `Błąd rozpoznawania mowy: ${event.error}`
        );
      }
      setIsListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognitionApi, lang, cancel]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  useEffect(() => cancel, [cancel]);

  return { isListening, interimTranscript, toggle, stop, cancel, supported };
}