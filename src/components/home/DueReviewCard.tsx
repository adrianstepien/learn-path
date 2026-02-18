import { motion } from 'framer-motion';
import { ArrowRight, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DueReviewCardProps {
  count: number;
}

export const DueReviewCard = ({ count }: DueReviewCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl gradient-primary p-6 shadow-lg shadow-glow"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/20" />
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-foreground/80">Do powtórki dziś</p>
            <p className="text-3xl font-bold text-primary-foreground">{count} pytań</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-primary-foreground/80">
          System SRS wybrał optymalne pytania do utrwalenia wiedzy.
        </p>

        <Button
          onClick={() => navigate('/learn/study')}
          className="w-full bg-white/20 text-primary-foreground hover:bg-white/30 backdrop-blur-sm"
        >
          Rozpocznij powtórkę
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};
