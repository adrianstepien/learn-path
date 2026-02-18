import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Lightbulb,
  Clock,
  Star,
  BookOpen,
  Mic,
  Trophy
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TiptapRenderer } from '@/components/study/TiptapRenderer';
import { createReview, getCardsToRepeatByCategory, getCardsToRepeatByRoadmap, getCardsToRepeatByTopic, getCardsToRepeat, getCardForStudy, StudyMode } from '@/lib/api/cards';
import { cn } from '@/lib/utils';
import { QuestionWithReview, ReviewRating } from '@/types/learning';

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-600',
  intermediate: 'bg-yellow-500/20 text-yellow-600',
  advanced: 'bg-orange-500/20 text-orange-600',
  expert: 'bg-red-500/20 text-red-600',
};

const ratingButtons = [
  { value: ReviewRating.AGAIN, label: 'Nie znam (Powtórz)', stars: 1 },
  { value: ReviewRating.HARD, label: 'Trudne', stars: 2 },
  { value: ReviewRating.GOOD, label: 'Dobre', stars: 3 },
  { value: ReviewRating.EASY, label: 'Łatwe', stars: 4 },
];

const StudyPage = () => {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const studyModeParam = (searchParams.get('mode') || 'SRS').toUpperCase() as StudyMode;
  const categoryId = searchParams.get('category');
  const roadmapId = searchParams.get('roadmap');
  const questionId = searchParams.get('question');

  const [questions, setQuestions] = useState<QuestionWithReview[]>([]);
  const [initialCount, setInitialCount] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);

  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [llmFeedback, setLlmFeedback] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [title, setTitle] = useState('');

  // --- NOWE ZMIENNE DO CZASU ---
  // Używamy useRef, aby zmiana tych wartości nie powodowała re-renderów
  const startTimeRef = useRef<string | undefined>(undefined);
  const answerShownTimeRef = useRef<string | undefined>(undefined);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      let collectedQuestions: any[] = [];
      let studyTitle = '';

      if (questionId) {
          const data = await getCardForStudy(questionId);
          if (data) {
              collectedQuestions = [data];
              studyTitle = "Nauka pytania";
          }
      } else if (topicId) {
          const data = await getCardsToRepeatByTopic(topicId, studyModeParam);
          if (data) {
              collectedQuestions = data;
              studyTitle = "Nauka tematu";
          }
      } else if (roadmapId) {
          const data = await getCardsToRepeatByRoadmap(roadmapId, studyModeParam);
          if (data) {
              collectedQuestions = data;
              studyTitle = "Nauka roadmapy";
          }
      } else if (categoryId) {
          const data = await getCardsToRepeatByCategory(categoryId, studyModeParam);
          if (data) {
            collectedQuestions = data;
            studyTitle = "Nauka kategorii";
        }
      } else {
          const data = await getCardsToRepeat();
            if (data) {
              collectedQuestions = data;
              studyTitle = "Powtórka w systemie";
          }
      }

      const finalQuestions = collectedQuestions.map(q => ({
        ...q,
        id: q.cardId?.toString() || q.id,
        question: typeof q.question === 'string' && q.question.startsWith('{')
                  ? JSON.parse(q.question).text
                  : q.question
      }));

      setQuestions(finalQuestions);
      setInitialCount(finalQuestions.length);
      setTitle(studyTitle);
      setHasFetched(true);
    };

    fetchData();
  }, [topicId, categoryId, roadmapId, questionId]);

  // --- LOGIKA CZASU STARTU (reviewStartedAt) ---
  // Uruchamia się za każdym razem, gdy zmienia się pierwsze pytanie w tablicy (czyli nowe pytanie wchodzi na ekran)
  useEffect(() => {
    if (questions.length > 0) {
      startTimeRef.current = new Date().toISOString();
      answerShownTimeRef.current = undefined; // Resetujemy czas pokazania odpowiedzi dla nowego pytania
    }
  }, [questions[0]?.id]);

  // Efekt licznika - uruchamia się, gdy dane są pobrane
  useEffect(() => {
    // Nie licz czasu, jeśli dane nie są pobrane lub sesja się skończyła (brak pytań)
    if (!hasFetched || (questions.length === 0 && initialCount > 0)) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [hasFetched, questions.length, initialCount]);

  const resetQuestionState = () => {
    setUserAnswer('');
    setShowAnswer(false);
    setLlmFeedback(null);
  };

  const skipQuestion = async () => {
    const currentQuestion = questions[0];
    const reviewCardDTO: ReviewRequestDTO = {
        cardId: currentQuestion.id,
        rating: ReviewRating.SKIP
    };

    await createReview(reviewCardDTO);

    setQuestions(prev => {
      const [, ...rest] = prev;
      return rest;
    });
    resetQuestionState();
  }

  // --- LOGIKA POKAZANIA ODPOWIEDZI (answerShownAt) ---
  const handleShowAnswer = () => {
    if (!answerShownTimeRef.current) {
        answerShownTimeRef.current = new Date().toISOString(); // answerShownAt: now()
    }
    setShowAnswer(true);
  };

  // --- LOGIKA OCENIANIA (rating) ---
  const handleRate = async (rating: ReviewRating) => {
    if (questions.length === 0) return;

    const currentQuestion = questions[0];

    // Tworzymy pełny obiekt z uzupełnionymi parametrami
    const reviewCardDTO: ReviewRequestDTO = {
        cardId: currentQuestion.id,
        rating: rating,
        reviewStartedAt: startTimeRef.current,      // Czas wejścia pytania na ekran
        answerShownAt: answerShownTimeRef.current  // Czas kliknięcia "Pokaż odpowiedź" (może być undefined, jeśli nie kliknął)
    };

    // Tutaj wywołanie API, np.:
    await createReview(reviewCardDTO);

    if (rating === ReviewRating.AGAIN) {
      // Jeśli "Nie znam" (1) -> przenieś na koniec kolejki
      setQuestions(prev => {
        const [current, ...rest] = prev;
        return [...rest, current];
      });
    } else {
      // Każda inna ocena -> usuń z kolejki
      setQuestions(prev => {
        const [, ...rest] = prev;
        return rest;
      });
    }

    resetQuestionState();
  };

  // --- EKRAN KOŃCOWY (gdy wyczerpano pytania) ---
  if (hasFetched && questions.length === 0 && initialCount > 0) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md bg-card p-8 rounded-2xl border border-border shadow-lg"
          >
            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500/20">
              <Trophy className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Sesja ukończona!</h2>
            <p className="text-muted-foreground mb-8">
              Przerobiłeś wszystkie {initialCount} zaplanowanych kart.
            </p>
            <p className="mt-4">
                Twój czas nauki: <span className="font-semibold text-foreground">{formatTime(elapsedSeconds)}</span>
            </p>
            <Button onClick={() => navigate(-1)} size="lg" className="w-full">
              Wróć do listy
            </Button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  // --- EKRAN BRAKU PYTAŃ (na starcie) ---
  if (hasFetched && questions.length === 0) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Brak pytań do nauki</h2>
            <p className="text-muted-foreground mb-6">
              Wygląda na to, że w tej sekcji nie ma kart wymgających powtórki.
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

  // Jeśli jeszcze ładuje
  if (!hasFetched || questions.length === 0) {
    return <MainLayout><div className="p-8 flex justify-center">Ładowanie...</div></MainLayout>;
  }

  // Zawsze bierzemy PIERWSZE pytanie z kolejki
  const question = questions[0];

  // Obliczanie postępu (ile zrobiliśmy vs ile było na początku)
  const progress = initialCount > 0 ? ((initialCount - questions.length) / initialCount) * 100 : 0;

  const handleVerifyWithLLM = async () => {
    setIsLoadingFeedback(true);
    // Opcjonalnie: Jeśli weryfikacja LLM też powinna liczyć się jako "pokazanie odpowiedzi",
    // odkomentuj poniższą linię:
    // if (!answerShownTimeRef.current) answerShownTimeRef.current = new Date().toISOString();

    await new Promise(resolve => setTimeout(resolve, 1500));
    setLlmFeedback(
      `**Analiza odpowiedzi:**\n\nTwoja odpowiedź jest weryfikowana przez AI. (To jest mockup).\n\n**Sugestia:** Sprawdź poprawność w oparciu o wzorcową odpowiedź.`
    );
    setIsLoadingFeedback(false);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setUserAnswer(prev => prev + ' [Transkrypcja mowy...]');
        setIsRecording(false);
      }, 2000);
    }
  };

  return (
    <MainLayout>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Powrót</span>
              </button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <span className="text-sm text-foreground font-medium truncate">{title}</span>
            </div>

            <div className="flex items-center gap-3 md:gap-4 shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground font-semibold">
                  {questions.length}
                </span>
                <span className="text-muted-foreground text-xs">pozostało</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 w-full rounded-full bg-secondary overflow-hidden">
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
            {/* Question Card */}
            <AnimatePresence mode="wait">
            <motion.div
              key={question.id} // Kluczowe dla animacji przy zmianie pytania
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative rounded-2xl border bg-card p-8 shadow-lg mb-6"
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={skipQuestion}
                className="absolute right-4 top-4 text-xs  hover:text-foreground"
              >
                Pomiń
              </Button>
              {/* Question Meta */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  // @ts-ignore - ignorujemy typowanie kluczy dla uproszczenia
                  difficultyColors[question.difficulty || 'beginner']
                )}>
                  {question.difficulty || 'beginner'}
                </span>
                <span className="text-xs text-muted-foreground capitalize px-2.5 py-0.5 rounded-full bg-secondary">
                  {question.type || 'open_ended'}
                </span>
              </div>

              {/* Question Content */}
              <h2 className="text-lg md:text-xl font-semibold text-foreground mb-6 leading-relaxed">
                <TiptapRenderer content={question.question} />
              </h2>

              {/* Hint */}
              {question.hint && (
                <div className="flex items-start gap-3 rounded-xl bg-warning/10 border border-warning/20 p-4 mb-6">
                  <Lightbulb className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{question.hint}</p>
                </div>
              )}

              {/* Answer Input - widoczne tylko gdy nie pokazano odpowiedzi */}
              {!showAnswer && !llmFeedback && (
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Wpisz swoją odpowiedź..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="min-h-[120px] pr-12 resize-none"
                  />
                  <button
                    onClick={toggleRecording}
                    className={cn(
                      'absolute right-3 top-3 rounded-full p-2 transition-all',
                      isRecording
                        ? 'bg-destructive text-destructive-foreground animate-pulse shadow-lg'
                        : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                    )}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
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
                  <Button
                    variant="outline"
                    onClick={handleShowAnswer}
                    size="lg"
                  >
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
                  <h4 className="font-medium text-foreground mb-2">Wzorcowa odpowiedź:</h4>
                  <div className="text-sm text-foreground leading-relaxed">
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
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-5 w-5 text-primary" />
                    <h4 className="font-medium text-foreground">Ocena AI</h4>
                  </div>
                  <div className="prose prose-sm text-foreground whitespace-pre-line">
                    {llmFeedback}
                  </div>
                </motion.div>
              )}
            </motion.div>
            </AnimatePresence>

            {/* Rating Section - TERAZ SŁUŻY JAKO NAWIGACJA */}
            {(showAnswer || llmFeedback) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="font-medium text-foreground mb-4 text-center">Jak oceniasz swoją odpowiedź?</h3>
                <div className="grid grid-cols-4 gap-2">
                  {ratingButtons.map((btn) => (
                    <button
                      key={btn.value}
                      onClick={() => handleRate(btn.value)}
                      className="rounded-xl border border-border p-2 md:p-3 text-center transition-all hover:border-primary hover:bg-primary/10 hover:scale-105"
                    >
                      <div className="flex justify-center mb-1">
                        {/* Generowanie gwiazdek na podstawie konfiguracji */}
                        {[...Array(btn.stars)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-warning text-warning" />
                        ))}
                      </div>
                      <span className="text-[10px] md:text-xs text-muted-foreground block font-semibold mt-1">
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

export default StudyPage;