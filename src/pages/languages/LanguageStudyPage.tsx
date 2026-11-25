import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Eye,
  Lightbulb,
  Loader2,
  Mic,
  Sparkles,
  Trophy,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FsrsRatingPanel } from '@/components/study/FsrsRatingPanel';
import { TiptapRenderer } from '@/components/study/TiptapRenderer';
import { SessionStatus, StudyMode } from '@/lib/api/types';
import { ReviewRating } from '@/types/learning';
import {
  createLanguageReview,
  generateExtraSentenceWithAi,
  LanguageStudyCardDto,
  startLanguageStudySession,
  updateLanguageStudySession,
} from '@/lib/api/languages';
import { languageKeys } from '@/hooks/queries/useLanguages';
import { analyticsKeys } from '@/hooks/queries/useAnalyticsSummary';
import {
  resolveSpeechLocale,
  useSpeechRecognition,
} from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { cn } from '@/lib/utils';

const renderHighlightedText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

const LanguageStudyPage = () => {
  const { langCode = 'en' } = useParams<{ langCode: string }>();
  const normalizedCode = langCode.toUpperCase();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const studyMode = (searchParams.get('mode') || 'SRS').toUpperCase() as StudyMode;

  const [cards, setCards] = useState<LanguageStudyCardDto[]>([]);
  const [initialCount, setInitialCount] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const [attemptSeq, setAttemptSeq] = useState(0);

  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isGeneratingSentence, setIsGeneratingSentence] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startTimeRef = useRef<string | undefined>(undefined);
  const answerShownTimeRef = useRef<string | undefined>(undefined);
  const sessionIdRef = useRef<number | null>(null);
  const sessionEndedRef = useRef(false);

  const { speak, stop: stopTts, supported: ttsSupported } = useSpeechSynthesis();

  const {
    isListening: isRecording,
    interimTranscript,
    toggle: toggleSpeechRecognition,
    stop: stopRecording,
    cancel: cancelRecording,
    supported: sttSupported,
  } = useSpeechRecognition({
    lang: resolveSpeechLocale(normalizedCode, 'en-US'),
    onFinalResult: (text) => {
      setUserAnswer((prev) => {
        const separator = prev.length > 0 && !/\s$/.test(prev) ? ' ' : '';
        return `${prev}${separator}${text}`;
      });
    },
    onError: (msg) => toast.error(msg),
  });

  const handleToggleRecording = () => {
    stopTts();
    toggleSpeechRecognition();
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const stopSessionIfActive = useCallback(async () => {
    if (sessionEndedRef.current || !sessionIdRef.current) return;
    sessionEndedRef.current = true;
    try {
      await updateLanguageStudySession(sessionIdRef.current, SessionStatus.STOPPED);
    } catch (err) {
      console.error('updateLanguageStudySession failed', err);
    } finally {
      queryClient.invalidateQueries({ queryKey: languageKeys.list() });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.summary() });
    }
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;
    const initSession = async () => {
      try {
        const session = await startLanguageStudySession(normalizedCode, studyMode);
        if (cancelled) return;
        sessionIdRef.current = session.sessionId;
        setCards(session.cards);
        setInitialCount(session.cards.length);
      } catch (err) {
        console.error('startLanguageStudySession failed', err);
        toast.error('Nie udało się rozpocząć sesji językowej.');
      } finally {
        if (!cancelled) setHasFetched(true);
      }
    };
    initSession();
    return () => {
      cancelled = true;
    };
  }, [normalizedCode, studyMode]);

  useEffect(() => {
    return () => {
      cancelRecording();
      stopTts();
      void stopSessionIfActive();
    };
  }, [cancelRecording, stopTts, stopSessionIfActive]);

  useEffect(() => {
    if (hasFetched && cards.length === 0 && initialCount > 0) {
      void stopSessionIfActive();
    }
  }, [hasFetched, cards.length, initialCount, stopSessionIfActive]);

  useEffect(() => {
    if (cards.length > 0) {
      startTimeRef.current = new Date().toISOString();
      answerShownTimeRef.current = undefined;
    }
  }, [cards[0]?.flashcardId, attemptSeq]);

  useEffect(() => {
    if (!hasFetched || (cards.length === 0 && initialCount > 0)) return;
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [hasFetched, cards.length, initialCount]);

  useEffect(() => {
    if (!showAnswer) {
      stopTts();
    }
  }, [showAnswer, cards[0]?.flashcardId, attemptSeq, stopTts]);

  useEffect(() => {
    if (!showAnswer || !ttsSupported) return;
    const current = cards[0];
    if (!current) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'r') {
        speak(current.targetWord, normalizedCode);
      } else if (key === 's' && current.sentence?.sentenceTarget) {
        speak(current.sentence.sentenceTarget, normalizedCode);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAnswer, ttsSupported, cards, normalizedCode, speak]);

  const resetCardState = () => {
    cancelRecording();
    stopTts();
    setUserAnswer('');
    setShowAnswer(false);
  };

  const handleGoBack = async () => {
    cancelRecording();
    stopTts();
    await stopSessionIfActive();
    navigate(-1);
  };

  const handleShowAnswer = () => {
    if (!showAnswer) {
      stopRecording();
      answerShownTimeRef.current = new Date().toISOString();
      setShowAnswer(true);
    }
  };

  const handleGenerateNewSentence = async () => {
    const current = cards[0];
    if (!current) return;
    setIsGeneratingSentence(true);
    try {
      const nextSentence = await generateExtraSentenceWithAi(current.flashcardId);
      setCards((prev) =>
        prev.map((c, idx) => (idx === 0 ? { ...c, sentence: nextSentence } : c))
      );
      toast.success('Wygenerowano i zapisano nowe zdanie.');
    } catch {
      toast.error('Nie udało się wygenerować nowego zdania.');
    } finally {
      setIsGeneratingSentence(false);
    }
  };

  const handleSkip = async () => {
    if (cards.length === 0 || !sessionIdRef.current || isSubmittingRating) return;
    setIsSubmittingRating(true);
    try {
      await createLanguageReview({
        flashcardId: cards[0].flashcardId,
        sessionId: sessionIdRef.current,
        rating: ReviewRating.SKIP,
        reviewStartedAt: startTimeRef.current,
      });
      setCards((prev) => prev.slice(1));
      setAttemptSeq((n) => n + 1);
      resetCardState();
    } catch {
      toast.error('Nie udało się pominąć fiszki.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleRate = async (rating: ReviewRating) => {
    if (cards.length === 0 || !sessionIdRef.current || isSubmittingRating) return;
    setIsSubmittingRating(true);
    try {
      const nextPreview = await createLanguageReview({
        flashcardId: cards[0].flashcardId,
        sessionId: sessionIdRef.current,
        rating,
        reviewStartedAt: startTimeRef.current,
        answerShownAt: answerShownTimeRef.current,
      });

      if (rating === ReviewRating.AGAIN) {
        setCards((prev) => {
          const [current, ...rest] = prev;
          return [
            ...rest,
            { ...current, intervalPreview: nextPreview ?? current.intervalPreview },
          ];
        });
      } else {
        setCards((prev) => prev.slice(1));
      }
      setAttemptSeq((n) => n + 1);
      resetCardState();
    } catch {
      toast.error('Nie udało się zapisać oceny.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (hasFetched && cards.length === 0 && initialCount > 0) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg"
          >
            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500/20">
              <Trophy className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Sesja ukończona!</h2>
            <p className="mb-4 text-muted-foreground">
              Przerobiłeś wszystkie {initialCount} zaplanowanych słówek ({normalizedCode}).
            </p>
            <p className="mb-8 text-sm text-muted-foreground">
              Czas nauki:{' '}
              <span className="font-semibold text-foreground">{formatTime(elapsedSeconds)}</span>
            </p>
            <Button onClick={() => navigate(-1)} size="lg" className="w-full">
              Powrót
            </Button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (hasFetched && cards.length === 0) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md text-center"
          >
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Brak słówek do powtórki
            </h2>
            <p className="mb-6 text-muted-foreground">
              Dodaj nowe słówka w katalogu języka {normalizedCode} lub wróć później.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => navigate(-1)} variant="outline" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót
              </Button>
              <Button onClick={() => navigate(`/languages/${langCode.toLowerCase()}`)} size="lg">
                Otwórz słówka
              </Button>
            </div>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (!hasFetched || cards.length === 0) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const card = cards[0];
  const progress =
    initialCount > 0 ? Math.round(((initialCount - cards.length) / initialCount) * 100) : 0;

  return (
    <MainLayout>
      <div className="flex h-screen flex-col">
        {/* Pasek górny */}
        <div className="border-b border-border bg-card/80 px-4 py-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <button
                onClick={handleGoBack}
                className="flex shrink-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Powrót</span>
              </button>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <span className="truncate text-sm font-medium text-foreground">
                Powtórka językowa · {normalizedCode} ({studyMode})
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3 md:gap-4">
              <div className="hidden items-center gap-2 sm:flex">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm text-muted-foreground">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">{cards.length}</span>
                <span className="text-xs text-muted-foreground">pozostało</span>
              </div>
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full gradient-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Główny obszar karty */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${card.flashcardId}-${attemptSeq}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative mb-6 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8"
              >
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleSkip}
                  disabled={isSubmittingRating}
                  className="absolute right-4 top-4 text-xs"
                >
                  Pomiń
                </Button>

                <div className="mb-5 flex flex-wrap items-center gap-2 pr-16">
                  {card.cefr && <Badge variant="outline">{card.cefr}</Badge>}
                  <Badge variant="secondary">{card.isCustom ? 'Własne' : 'Słownik'}</Badge>
                </div>

                <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
                  {card.nativeMeaning}
                </h2>

                {card.sentence && (
                  <div className="mb-6 rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-base leading-relaxed text-foreground">
                      {renderHighlightedText(card.sentence.sentenceNative)}
                    </p>
                  </div>
                )}

                {!showAnswer && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Textarea
                        placeholder={`Wpisz lub powiedz po ${normalizedCode}...`}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="min-h-[84px] resize-none pr-12"
                      />
                      {sttSupported && (
                        <button
                          type="button"
                          onClick={handleToggleRecording}
                          title={
                            isRecording
                              ? 'Zatrzymaj dyktowanie'
                              : `Dyktuj odpowiedź (${normalizedCode})`
                          }
                          className={cn(
                            'absolute right-3 top-3 rounded-full p-2 transition-all',
                            isRecording
                              ? 'animate-pulse bg-destructive text-destructive-foreground shadow-lg'
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                          )}
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {interimTranscript && (
                      <p className="text-xs italic text-muted-foreground">
                        {interimTranscript}...
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <Button onClick={handleShowAnswer} size="lg" className="flex-1">
                        <Eye className="mr-2 h-4 w-4" />
                        Pokaż odpowiedź
                      </Button>
                    </div>
                  </div>
                )}

                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    {userAnswer.trim() && (
                      <div className="rounded-xl border border-border bg-secondary/40 p-4">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Twoja odpowiedź:
                        </p>
                        <p className="text-base text-foreground">{userAnswer}</p>
                      </div>
                    )}

                    <div className="rounded-xl border border-success/30 bg-success/10 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-foreground">{card.targetWord}</p>
                          {ttsSupported && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => speak(card.targetWord, normalizedCode)}
                              title="Odsłuchaj słówko (R)"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {card.ipa && (
                          <span className="font-mono text-sm text-muted-foreground">
                            {card.ipa}
                          </span>
                        )}
                      </div>

                      {card.sentence?.sentenceTarget && (
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <p className="text-base text-foreground">
                            {card.sentence.sentenceTarget}
                          </p>
                          {ttsSupported && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() =>
                                speak(card.sentence!.sentenceTarget, normalizedCode)
                              }
                              title="Odsłuchaj zdanie (S)"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {card.trapNote && card.trapNote !== '<p></p>' && (
                      <div className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/10 p-4">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                        <div className="min-w-0 flex-1 text-sm text-foreground">
                          <TiptapRenderer key={card.flashcardId} content={card.trapNote} />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateNewSentence}
                        disabled={isGeneratingSentence}
                      >
                        {isGeneratingSentence ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        )}
                        Dodaj i pokaż kolejne zdanie (AI)
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {showAnswer && (
              <FsrsRatingPanel
                disabled={isSubmittingRating}
                intervalPreview={card.intervalPreview}
                onRate={handleRate}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LanguageStudyPage;