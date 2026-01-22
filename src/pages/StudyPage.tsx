import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Mic,
  Send,
  Bot,
  Lightbulb,
  Clock,
  Star
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getTopicById } from '@/data/mockData';
import { cn } from '@/lib/utils';

const difficultyColors = {
  beginner: 'bg-success/20 text-success',
  intermediate: 'bg-warning/20 text-warning',
  advanced: 'bg-destructive/20 text-destructive',
  expert: 'bg-primary/20 text-primary',
};

const StudyPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [llmFeedback, setLlmFeedback] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const topic = getTopicById(topicId || '');

  if (!topic || topic.questions.length === 0) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Brak pytań do nauki w tym temacie</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const question = topic.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / topic.questions.length) * 100;

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      resetQuestionState();
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < topic.questions.length - 1) {
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
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Powrót
              </button>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm text-muted-foreground">{topic.title}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">00:00</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground font-medium">
                  {currentQuestionIndex + 1}/{topic.questions.length}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full rounded-full bg-secondary">
            <motion.div
              className="h-1.5 rounded-full gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl p-8">
            {/* Question Card */}
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-lg mb-6"
            >
              {/* Question Meta */}
              <div className="flex items-center gap-2 mb-4">
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  difficultyColors[question.difficulty]
                )}>
                  {question.difficulty}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {question.type.replace('_', ' ')}
                </span>
              </div>

              {/* Question Content */}
              <h2 className="text-xl font-semibold text-foreground mb-6">
                {question.content}
              </h2>

              {/* Hint */}
              {question.hint && (
                <div className="flex items-start gap-3 rounded-lg bg-warning/10 p-4 mb-6">
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
                    className="min-h-[120px] pr-12"
                  />
                  <button
                    onClick={toggleRecording}
                    className={cn(
                      'absolute right-3 top-3 rounded-full p-2 transition-colors',
                      isRecording 
                        ? 'bg-destructive text-destructive-foreground animate-pulse' 
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleVerifyWithLLM}
                    disabled={!userAnswer.trim() || isLoadingFeedback}
                    className="flex-1"
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
                  className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4"
                >
                  <h4 className="font-medium text-foreground mb-2">Wzorcowa odpowiedź:</h4>
                  <p className="text-sm text-foreground">{question.answer}</p>
                </motion.div>
              )}

              {/* LLM Feedback */}
              {llmFeedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 rounded-lg border border-primary/30 bg-primary/10 p-4"
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
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      className="flex-1 rounded-lg border border-border p-3 text-center transition-all hover:border-primary hover:bg-primary/10"
                    >
                      <div className="flex justify-center mb-1">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {rating === 1 && 'Nie znam'}
                        {rating === 2 && 'Słabo'}
                        {rating === 3 && 'Średnio'}
                        {rating === 4 && 'Dobrze'}
                        {rating === 5 && 'Doskonale'}
                      </span>
                    </button>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Oznacz jako przerobione
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Poprzednie
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentQuestionIndex === topic.questions.length - 1}
            >
              Następne
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudyPage;
