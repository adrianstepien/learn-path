import React from 'react';
import { motion } from 'framer-motion';
import { Chrome, BookOpen, Flame } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api/config';

const LoginPage = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8
                 bg-gradient-to-br from-neutral-50 to-neutral-100
                 dark:from-neutral-900 dark:to-neutral-950"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-2xl p-8 text-center shadow-xl
                     bg-white dark:bg-neutral-900/60
                     border border-border dark:border-neutral-800 backdrop-blur-md"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl
                         bg-gradient-to-r from-amber-400 to-rose-400  gradient-primary
                         dark:from-amber-600 dark:to-rose-600 shadow-md"
            >
              <BookOpen className="h-7 w-7 text-white absolute bottom-2" />
              <Flame className="h-6 w-6 text-white/90 absolute top-1" />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold mb-1 text-foreground">
            Learn Lantern
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Ucz się szybciej. Prościej. Mądrzej.
          </p>

          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Zaloguj się
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Jedno kliknięcie i wracasz do nauki.
          </p>

          <button
            onClick={handleGoogleLogin}
            aria-label="Zaloguj się przez Google"
            className="w-full inline-flex items-center justify-center gap-3
                       rounded-lg border px-5 py-3 text-sm font-medium
                       bg-white dark:bg-neutral-800
                       border-border dark:border-neutral-700
                       shadow-sm hover:shadow-md transition
                       focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <Chrome className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground">Zaloguj przez Google</span>
          </button>

          <p className="mt-4 text-xs text-muted-foreground">
            Zostaniesz przekierowany do bezpiecznego logowania Google.
          </p>

          <p className="mt-6 text-xs text-muted-foreground">
            Nie masz konta?{' '}
            <span className="font-medium">
              Zostanie utworzone automatycznie.
            </span>
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Masz problem?{' '}
          <a
            href="/support"
            className="text-primary font-medium hover:underline"
          >
            Skontaktuj się z nami
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;