import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { ReviewRating } from '@/types/learning';
import { IntervalPreviewDto } from '@/lib/api/types';

const RATING_BUTTONS = [
  { value: ReviewRating.AGAIN, label: 'Nie znam (Powtórz)', stars: 1, key: 'again' },
  { value: ReviewRating.HARD, label: 'Trudne', stars: 2, key: 'hard' },
  { value: ReviewRating.GOOD, label: 'Dobre', stars: 3, key: 'good' },
  { value: ReviewRating.EASY, label: 'Łatwe', stars: 4, key: 'easy' },
] as const;

interface FsrsRatingPanelProps {
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean;
  intervalPreview?: IntervalPreviewDto;
}

export const FsrsRatingPanel = ({ onRate, disabled = false, intervalPreview }: FsrsRatingPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h3 className="mb-4 text-center font-medium text-foreground">
        Jak oceniasz swoją odpowiedź?
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {RATING_BUTTONS.map((btn) => (
          <button
            key={btn.value}
            type="button"
            disabled={disabled}
            onClick={() => onRate(btn.value)}
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
            {intervalPreview && (
              <span className="mt-0.5 block text-[10px] font-medium text-primary md:text-xs">
                {intervalPreview[btn.key]}
              </span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
};