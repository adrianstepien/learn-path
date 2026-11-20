import { useEffect, useRef, useState } from 'react';
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
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const ratingButtons = [
  { value: ReviewRating.AGAIN, label: 'Nie znam (Powtórz)', stars: 1 },
  { value: ReviewRating.HARD, label: 'Trudne', stars: 2 },
  { value: ReviewRating.GOOD, label: 'Dobre', stars: 3 },
  { value: ReviewRating.EASY, label: 'Łatwe', stars: 4 },
];

/** Bezpieczne renderowanie **pogrubienia** bez dangerouslySetInnerHTML */
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

  const [showAnswer, setShowAnswer] = useState(false);
  const [showClozeHint, setShowClozeHint] = useState(false);
  const [isGeneratingSentence, setIsGeneratingSentence] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startTimeRef = useRef<string | undefined>(undefined);
  const answerShownTimeRef = useRef<string | undefined>(undefined);
  const sessionIdRef = useRef<number | null>(null);
  const sessionEndedRef = useRef(false);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Pobranie sesji na start
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

  // Zakończenie sesji i odświeżenie liczników
  useEffect(() => {
    if (
      hasFetched &&
      cards.length === 0 &&
      initialCount > 0 &&
      !sessionEndedRef.current &&
      sessionIdRef.current
    ) {
      sessionEndedRef.current = true;
      (async () => {
        try {
          await updateLanguageStudySession(sessionIdRef.current!, SessionStatus.STOPPED);
        } catch (err) {
          console.error('updateLanguageStudySession failed', err);
        } finally {
          queryClient.invalidateQueries({ queryKey: languageKeys.list() });
          queryClient.invalidateQueries({ queryKey: analyticsKeys.summary() });
        }
      })();
    }
  }, [hasFetched, cards.length, initialCount, queryClient]);

  // Rejestracja czasu wyświetlenia bieżącej karty
  useEffect(() => {
    if (cards.length > 0) {
      startTimeRef.current = new Date().toISOString();
      answerShownTimeRef.current = undefined;
    }
  }, [cards[0]?.flashcardId, cards.length]);

  // Stoper sesji
  useEffect(() => {
    if (!hasFetched || (cards.length === 0 && initialCount > 0)) return;
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [hasFetched, cards.length, initialCount]);

  const resetCardUi = () => {
    setShowAnswer(false);
    setShowClozeHint(false);
  };

  const handleShowAnswer = () => {
    if (!showAnswer) {
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
      resetCardUi();
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
      await createLanguageReview({
        flashcardId: cards[0].flashcardId,
        sessionId: sessionIdRef.current,
        rating,
        reviewStartedAt: startTimeRef.current,
        answerShownAt: answerShownTimeRef.current,
      });

      if (rating === ReviewRating.AGAIN) {
        setCards((prev) => {
          const [current, ...rest] = prev;
          return [...rest, current];
        });
      } else {
        setCards((prev) => prev.slice(1));
      }
      resetCardUi();
    } catch {
      toast.error('Nie udało się zapisać oceny.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Ekran ukończenia
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

  // Ekran braku kart
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
                onClick={() => navigate(-1)}
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
                key={card.flashcardId}
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

                {/* Metadane */}
                <div className="mb-5 flex flex-wrap items-center gap-2 pr-16">
                  <Badge variant="secondary">{card.primarySource}</Badge>
                  {card.cefr && <Badge variant="outline">{card.cefr}</Badge>}
                  {card.hint && (
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      Podpowiedź: {card.hint}
                    </Badge>
                  )}
                </div>

                {/* Przód karty: znaczenie PL */}
                <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
                  {card.nativeMeaning}
                </h2>

                {/* Zdjęcie skojarzeniowe */}
                {card.imageUrl && (
                  <div className="mb-5 overflow-hidden rounded-xl border border-border bg-secondary/20 p-2">
                    <img
                      src={card.imageUrl}
                      alt=""
                      className="mx-auto max-h-48 w-auto rounded-lg object-contain"
                    />
                  </div>
                )}

                {/* Zdanie kontekstowe PL + opcjonalna luka */}
                {card.sentence && (
                  <div className="mb-6 rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-base leading-relaxed text-foreground">
                      {renderHighlightedText(card.sentence.sentenceNative)}
                    </p>
                    {showClozeHint && card.sentence.clozeTarget && !showAnswer && (
                      <p className="mt-2 font-mono text-sm text-muted-foreground">
                        {card.sentence.clozeTarget}
                      </p>
                    )}
                  </div>
                )}

                {/* Akcje przed odsłonięciem */}
                {!showAnswer && (
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleShowAnswer} size="lg" className="flex-1">
                      <Eye className="mr-2 h-4 w-4" />
                      Pokaż odpowiedź
                    </Button>

                    {card.sentence?.clozeTarget && !showClozeHint && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setShowClozeHint(true)}
                      >
                        Pokaż lukę
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleGenerateNewSentence}
                      disabled={isGeneratingSentence}
                    >
                      {isGeneratingSentence ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4 text-primary" />
                      )}
                      Nowe zdanie (AI)
                    </Button>
                  </div>
                )}

                {/* Tył karty: odpowiedź docelowa */}
                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div className="rounded-xl border border-success/30 bg-success/10 p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-2xl font-bold text-foreground">{card.targetWord}</p>
                        {card.ipa && (
                          <span className="font-mono text-sm text-muted-foreground">
                            {card.ipa}
                          </span>
                        )}
                      </div>

                      {card.sentence?.sentenceTarget && (
                        <p className="mt-3 text-base text-foreground">
                          {card.sentence.sentenceTarget}
                        </p>
                      )}
                    </div>

                    {card.trapNote && (
                      <div className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/10 p-4">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                        <p className="text-sm text-foreground">{card.trapNote}</p>
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

            {/* Panel ocen FSRS-6 */}
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="mb-4 text-center font-medium text-foreground">
                  Jak oceniasz swoją odpowiedź?
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {ratingButtons.map((btn) => (
                    <button
                      key={btn.value}
                      disabled={isSubmittingRating}
                      onClick={() => handleRate(btn.value)}
                      className="rounded-xl border border-border p-2 text-center transition-all hover:scale-105 hover:border-primary hover:bg-primary/10 disabled:opacity-50 md:p-3"
                    >
                      <div className="mb-1 flex justify-center">
                        {[...Array(btn.stars)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-warning text-warning md:h-4 md:w-4"
                          />
                        ))}
                      </div>
                      <span className="mt-1 block text-[10px] font-semibold text-muted-foreground md:text-xs">
                        {btn.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LanguageStudyPage;