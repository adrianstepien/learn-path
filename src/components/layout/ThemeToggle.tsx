import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative flex h-9 w-16 items-center rounded-full bg-secondary p-1 transition-colors hover:bg-secondary/80',
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        className="flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-sm"
        animate={{ x: theme === 'dark' ? 28 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {theme === 'dark' ? (
          <Moon className="h-4 w-4 text-primary" />
        ) : (
          <Sun className="h-4 w-4 text-warning" />
        )}
      </motion.div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
