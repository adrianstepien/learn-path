import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

/**
 * Presentational component for the Learn page header
 * Follows SRP - only responsible for rendering the header section
 */
export const LearnPageHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 md:mb-8"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Nauka</h1>
          <p className="text-sm text-muted-foreground">
            Wybierz kategorię, aby rozpocząć naukę
          </p>
        </div>
      </div>
    </motion.div>
  );
};