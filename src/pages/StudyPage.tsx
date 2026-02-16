import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Mic,
  Bot,
  Lightbulb,
  Clock,
  Star,
  BookOpen
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TiptapRenderer } from '@/components/study/TiptapRenderer';
import { getTopicById, getCategoryById, getRoadmapById, mockCategories } from '@/data/mockData';
import { getCardsToRepeatByCategory, getCardsToRepeatByRoadmap, getCardsToRepeatByTopic } from '@/lib/api/cards';
import { cn } from '@/lib/utils';
import { Question } from '@/types/learning';

const difficultyColors = {
  beginner: 'bg-success/20 text-success',
  intermediate: 'bg-warning/20 text-warning',
  advanced: 'bg-destructive/20 text-destructive',
  expert: 'bg-primary/20 text-primary',
};

const StudyPage = () => {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const categoryId = searchParams.get('category');
  const roadmapId = searchParams.get('roadmap');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [llmFeedback, setLlmFeedback] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Collect all questions based on mode
  useEffect(() => {
    const fetchData = async () => {
      let collectedQuestions: any[] = [];
    let studyTitle = '';

    if (topicId) {
        // Study specific topic
        const data = await getCardsToRepeatByTopic(topicId);
        if (data) {
            collectedQuestions = data;
            //TODO: do zmiany
            studyTitle = "Powtórka kategorii";
        }
    } else if (roadmapId) {
        // Study entire roadmap
        const data = await getCardsToRepeatByRoadmap(roadmapId);
        if (data) {
            collectedQuestions = data;
            //TODO: do zmiany
            studyTitle = "Powtórka kategorii";
        }
    } else if (categoryId) {
        // Study entire category
        const data = await getCardsToRepeatByCategory(categoryId);
        if (data) {
          collectedQuestions = data;
          //TODO: do zmiany
          studyTitle = "Powtórka kategorii";
      }
    }

      // Normalizacja danych: obsługa id oraz parsowanie treści pytania, jeśli jest w formacie JSON
      const finalQuestions = collectedQuestions.map(q => ({
        ...q,
        id: q.cardId?.toString() || q.id,
        question: typeof q.question === 'string' && q.question.startsWith('{')
                  ? JSON.parse(q.question).text
                  : q.question
      }));

      setQuestions(finalQuestions);
      setTitle(studyTitle);
    };

    fetchData();
  }, [topicId, categoryId, roadmapId]);

  if (questions.length === 0) {
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
              {categoryId 
                ? 'W tej kategorii nie ma jeszcze pytań. Dodaj pytania do tematów, aby rozpocząć naukę.'
                : roadmapId 
                  ? 'W tej roadmapie nie ma jeszcze pytań.'
                  : 'W tym temacie nie ma jeszcze pytań.'
              }
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

  const question = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      resetQuestionState();
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuestionState();
    }
  };

  const resetQuestionState = () => {
    setUserAnswer('');
    setShowAnswer(false);
    setLlmFeedback(null);
  };

  const handleVerifyWithLLM = async () => {
    setIsLoadingFeedback(true);
    // Simulate LLM response
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLlmFeedback(
      `**Analiza odpowiedzi:**\n\nTwoja odpowiedź jest częściowo poprawna. Dobrze wyjaśniłeś podstawowe pojęcia, jednak brakuje kilku kluczowych szczegółów:\n\n- Warto wspomnieć o izolacji na poziomie systemu plików\n- Nie uwzględniłeś aspektu sieciowego kontenerów\n\n**Sugestia:** Zapoznaj się z dokumentacją dotyczącą namespaces i cgroups w kontekście Docker.`
    );
    setIsLoadingFeedback(false);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, this would use the Web Speech API
    if (!isRecording) {
      // Start recording
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
                <span className="text-sm text-muted-foreground">00:00</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground font-semibold">
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-primary"
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
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-lg mb-6"
            >
              {/* Question Meta */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  difficultyColors['beginner']
                )}>
                  {'beginner'}
                </span>
                <span className="text-xs text-muted-foreground capitalize px-2.5 py-0.5 rounded-full bg-secondary">
                  {'open_ended'}
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

              {/* Answer Input */}
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
                    onClick={() => setShowAnswer(!showAnswer)}
                    size="lg"
                  >
                    {showAnswer ? 'Ukryj odpowiedź' : 'Pokaż odpowiedź'}
                  </Button>
                </div>
              </div>

              {/* Expected Answer */}
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 rounded-xl border border-success/30 bg-success/10 p-4"
                >
                  <h4 className="font-medium text-foreground mb-2">Wzorcowa odpowiedź:</h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    <TiptapRenderer content={question.answer} />
                  </p>
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
                  <p className="mt-3 text-xs text-muted-foreground italic">
                    ⚠️ Ocena automatyczna – może zawierać błędy
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Rating Section */}
            {(showAnswer || llmFeedback) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="font-medium text-foreground mb-4">Jak dobrze znasz to zagadnienie?</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(rating => (
                    <button
                      key={rating}
                      className="rounded-xl border border-border p-2 md:p-3 text-center transition-all hover:border-primary hover:bg-primary/10 hover:scale-105"
                    >
                      <div className="flex justify-center mb-1">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-warning text-warning" />
                        ))}
                      </div>
                      <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                        {rating === 1 && 'Nie znam'}
                        {rating === 2 && 'Słabo'}
                        {rating === 3 && 'Średnio'}
                        {rating === 4 && 'Dobrze'}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-border bg-card/80 backdrop-blur-sm px-4 md:px-6 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              size="lg"
            >
              <ChevronLeft className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Poprzednie</span>
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              size="lg"
            >
              <span className="hidden sm:inline">Następne</span>
              <ChevronRight className="ml-1 md:ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudyPage;
