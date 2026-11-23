import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Lightbulb,
  Clock,
  BookOpen,
  Mic,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FsrsRatingPanel } from '@/components/study/FsrsRatingPanel';
import { TiptapRenderer } from '@/components/study/TiptapRenderer';
import { createReview, startStudySession, updateStudySession } from '@/lib/api/cards';
import {
  ReviewRequestDTO,
  SessionStatus,
  SessionType,
  StudyMode,
} from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { QuestionWithReview, ReviewRating } from '@/types/learning';

const getDifficultyConfig = (difficultyValue?: number | string | null) => {
  const numeric =
    difficultyValue === null || difficultyValue === undefined || difficultyValue === ''
      ? NaN
      : Number(difficultyValue);

  if (!Number.isFinite(numeric)) {
    return { label: 'Brak oceny trudności', color: 'bg-secondary text-muted-foreground' };
  }
  if (numeric <= 3) {
    return { label: `Łatwe (${numeric}/10)`, color: 'bg-green-500/20 text-green-600' };
  }
  if (numeric <= 6) {
    return { label: `Średnie (${numeric}/10)`, color: 'bg-yellow-500/20 text-yellow-600' };
  }
  if (numeric <= 8) {
    return { label: `Trudne (${numeric}/10)`, color: 'bg-orange-500/20 text-orange-600' };
  }
  return { label: `Wyjątkowo trudne (${numeric}/10)`, color: 'bg-red-500/20 text-red-600' };
};

const StudyPage = () => {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawMode = (searchParams.get('mode') || 'SRS').toUpperCase();
  const studyModeParam = rawMode === StudyMode.FUTURE ? StudyMode.FUTURE : StudyMode.SRS;
  const categoryId = searchParams.get('category');
  const roadmapId = searchParams.get('roadmap');
  const questionId = searchParams.get('question');

  const [questions, setQuestions] = useState<QuestionWithReview[]>([]);
  const [initialCount, setInitialCount] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const [attemptSeq, setAttemptSeq] = useState(0);

  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [llmFeedback, setLlmFeedback] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
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

  const stopSessionIfActive = useCallback(async () => {
    if (sessionEndedRef.current || !sessionIdRef.current) return;
    sessionEndedRef.current = true;
    const sessionId = sessionIdRef.current;
    try {
      await updateStudySession(sessionId, {
        sessionStatus: SessionStatus.STOPPED,
      });
    } catch (err) {
      console.error('updateStudySession failed', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    sessionIdRef.current = null;
    sessionEndedRef.current = false;
    setHasFetched(false);
    setQuestions([]);
    setInitialCount(0);
    setAttemptSeq(0);
    setElapsedSeconds(0);
    setUserAnswer('');
    setShowAnswer(false);
    setLlmFeedback(null);

    const fetchData = async () => {
      let sessionType = SessionType.GLOBAL;
      let contextId: number | undefined = undefined;
      let studyTitle = 'Nauka w systemie';

      if (questionId) {
        sessionType = SessionType.CARD;
        contextId = Number(questionId);
        studyTitle = 'Nauka pytania';
      } else if (topicId) {
        sessionType = SessionType.TOPIC;
        contextId = Number(topicId);
        studyTitle = 'Nauka tematu';
      } else if (roadmapId) {
        sessionType = SessionType.ROADMAP;
        contextId = Number(roadmapId);
        studyTitle = 'Nauka roadmapy';
      } else if (categoryId) {
        sessionType = SessionType.CATEGORY;
        contextId = Number(categoryId);
        studyTitle = 'Nauka kategorii';
      }

      try {
        const sessionData = await startStudySession({
          sessionType,
          contextId,
          mode: studyModeParam,
        });

        if (cancelled) {
          void updateStudySession(sessionData.sessionId, {
            sessionStatus: SessionStatus.STOPPED,
          });
          return;
        }

        sessionIdRef.current = sessionData.sessionId;

        const finalQuestions = sessionData.cards.map((q: any) => ({
          ...q,
          id: q.cardId?.toString() || q.id,
          question:
            typeof q.question === 'string' && q.question.startsWith('{')
              ? JSON.parse(q.question).text
              : q.question,
        }));

        setQuestions(finalQuestions);
        setInitialCount(finalQuestions.length);
        setTitle(studyTitle);

        if (finalQuestions.length === 0) {
          void stopSessionIfActive();
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Błąd podczas otwierania sesji nauki', error);
          toast.error('Nie udało się rozpocząć sesji nauki.');
        }
      } finally {
        if (!cancelled) setHasFetched(true);
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
      void stopSessionIfActive();
    };
  }, [topicId, categoryId, roadmapId, questionId, studyModeParam, stopSessionIfActive]);

  useEffect(() => {
    if (hasFetched && questions.length === 0 && initialCount > 0) {
      void stopSessionIfActive();
    }
  }, [hasFetched, questions.length, initialCount, stopSessionIfActive]);

  useEffect(() => {
    if (questions.length > 0) {
      startTimeRef.current = new Date().toISOString();
      answerShownTimeRef.current = undefined;
    }
  }, [questions[0]?.id, attemptSeq]);

  useEffect(() => {
    if (!hasFetched || questions.length === 0) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [hasFetched, questions.length]);

  const resetQuestionState = () => {
    setUserAnswer('');
    setShowAnswer(false);
    setLlmFeedback(null);
  };

  const handleGoBack = async () => {
    await stopSessionIfActive();
    navigate(-1);
  };

  const skipQuestion = async () => {
    if (questions.length === 0 || !sessionIdRef.current || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const currentQuestion = questions[0];
      const reviewRequestDTO: ReviewRequestDTO = {
        cardId: currentQuestion.id,
        sessionId: sessionIdRef.current,
        rating: ReviewRating.SKIP,
      };

      await createReview(reviewRequestDTO);

      setQuestions((prev) => {
        const [, ...rest] = prev;
        return rest;
      });
      setAttemptSeq((n) => n + 1);
      resetQuestionState();
    } catch {
      toast.error('Nie udało się pominąć pytania.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowAnswer = () => {
    if (!answerShownTimeRef.current) {
      answerShownTimeRef.current = new Date().toISOString();
    }
    setShowAnswer(true);
  };

  const handleRate = async (rating: ReviewRating) => {
    if (questions.length === 0 || !sessionIdRef.current || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const currentQuestion = questions[0];

      const reviewRequestDTO: ReviewRequestDTO = {
        cardId: currentQuestion.id,
        rating,
        sessionId: sessionIdRef.current,
        reviewStartedAt: startTimeRef.current,
        answerShownAt: answerShownTimeRef.current,
      };

      await createReview(reviewRequestDTO);

      if (rating === ReviewRating.AGAIN) {
        setQuestions((prev) => {
          const [current, ...rest] = prev;
          return [...rest, current];
        });
      } else {
        setQuestions((prev) => {
          const [, ...rest] = prev;
          return rest;
        });
      }
      setAttemptSeq((n) => n + 1);
      resetQuestionState();
    } catch {
      toast.error('Nie udało się zapisać oceny.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasFetched && questions.length === 0 && initialCount > 0) {
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
              Przerobiłeś wszystkie {initialCount} zaplanowanych kart.
            </p>
            <p className="mb-8 text-sm text-muted-foreground">
              Twój czas nauki:{' '}
              <span className="font-semibold text-foreground">{formatTime(elapsedSeconds)}</span>
            </p>
            <Button onClick={() => navigate(-1)} size="lg" className="w-full">
              Wróć do listy
            </Button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (hasFetched && questions.length === 0) {
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
            <h2 className="mb-2 text-xl font-semibold text-foreground">Brak pytań do nauki</h2>
            <p className="mb-6 text-muted-foreground">
              Wygląda na to, że w tej sekcji nie ma kart wymagających powtórki.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót
            </Button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (!hasFetched || questions.length === 0) {
    return (
      <MainLayout>
        <div className="flex justify-center p-8">Ładowanie...</div>
      </MainLayout>
    );
  }

  const question = questions[0];
  const diffConfig = getDifficultyConfig(question.difficulty);
  const progress = initialCount > 0 ? ((initialCount - questions.length) / initialCount) * 100 : 0;

  const handleVerifyWithLLM = async () => {
    setIsLoadingFeedback(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLlmFeedback(
      `**Analiza odpowiedzi:**\n\nTwoja odpowiedź jest weryfikowana przez AI. (To jest mockup).\n\n**Sugestia:** Sprawdź poprawność w oparciu o wzorcową odpowiedź.`
    );
    setIsLoadingFeedback(false);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setUserAnswer((prev) => prev + ' [Transkrypcja mowy...]');
        setIsRecording(false);
      }, 2000);
    }
  };

  return (
    <MainLayout>
      <div className="flex h-screen flex-col">
        {/* Header */}
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
              <span className="truncate text-sm font-medium text-foreground">{title}</span>
            </div>

            <div className="flex shrink-0 items-center gap-3 md:gap-4">
              <div className="hidden items-center gap-2 sm:flex">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm text-muted-foreground">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">{questions.length}</span>
                <span className="text-xs text-muted-foreground">pozostało</span>
              </div>
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full gradient-primary bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${question.id}-${attemptSeq}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative mb-6 rounded-2xl border bg-card p-8 shadow-lg"
              >
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={skipQuestion}
                  disabled={isSubmitting}
                  className="absolute right-4 top-4 text-xs hover:text-foreground"
                >
                  Pomiń
                </Button>

                {/* Question Meta */}
                <div className="mb-4 flex flex-wrap items-center gap-2 pr-16">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      diffConfig.color
                    )}
                  >
                    {diffConfig.label}
                  </span>
                </div>

                {/* Question Content */}
                <h2 className="mb-6 text-lg font-semibold leading-relaxed text-foreground md:text-xl">
                  <TiptapRenderer content={question.question} />
                </h2>

                {/* Hint */}
                {question.hint && (
                  <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/10 p-4">
                    <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
                    <p className="text-sm text-foreground">{question.hint}</p>
                  </div>
                )}

                {/* Answer Input */}
                {!showAnswer && !llmFeedback && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Textarea
                        placeholder="Wpisz swoją odpowiedź..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="min-h-[120px] resize-none pr-12"
                      />
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={cn(
                          'absolute right-3 top-3 rounded-full p-2 transition-all',
                          isRecording
                            ? 'animate-pulse bg-destructive text-destructive-foreground shadow-lg'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                        )}
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        onClick={handleVerifyWithLLM}
                        disabled={!userAnswer.trim() || isLoadingFeedback}
                        className="flex-1"
                        size="lg"
                      >
                        {isLoadingFeedback ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Analizuję...
                          </>
                        ) : (
                          <>
                            <Bot className="mr-2 h-4 w-4" />
                            Sprawdź z AI
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleShowAnswer} size="lg">
                        Pokaż odpowiedź
                      </Button>
                    </div>
                  </div>
                )}

                {/* Expected Answer */}
                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 rounded-xl border border-success/30 bg-success/10 p-4"
                  >
                    <h4 className="mb-2 font-medium text-foreground">Wzorcowa odpowiedź:</h4>
                    <div className="text-sm leading-relaxed text-foreground">
                      <TiptapRenderer content={question.answer} />
                    </div>
                  </motion.div>
                )}

                {/* LLM Feedback */}
                {llmFeedback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <h4 className="font-medium text-foreground">Ocena AI</h4>
                    </div>
                    <div className="prose prose-sm whitespace-pre-line text-foreground">
                      {llmFeedback}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Rating Section */}
            {(showAnswer || llmFeedback) && (
              <FsrsRatingPanel onRate={handleRate} disabled={isSubmitting} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudyPage;