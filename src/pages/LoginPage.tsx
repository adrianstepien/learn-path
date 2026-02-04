import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen,
  Flame,
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowRight,
  Github,
  Chrome
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <BookOpen className="h-6 w-6 text-primary-foreground absolute bottom-2" />
              <Flame className="h-5 w-5 text-amber-300 absolute top-1.5" />
            </div>
            <span className="text-2xl font-bold text-gradient">Learn Lantern</span>
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLogin ? 'Witaj ponownie!' : 'Utwórz konto'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isLogin 
              ? 'Zaloguj się, aby kontynuować naukę' 
              : 'Dołącz do nas i rozpocznij swoją przygodę z nauką'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Imię
                </label>
                <Input placeholder="Jan Kowalski" />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="jan@example.com" className="pl-10" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Hasło
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" 
                  className="pl-10 pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" className="rounded border-border" />
                  Zapamiętaj mnie
                </label>
                <button type="button" className="text-sm text-primary hover:underline">
                  Zapomniałeś hasła?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg">
              {isLogin ? 'Zaloguj się' : 'Utwórz konto'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">lub kontynuuj z</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" className="flex-1">
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>

          {/* Switch */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isLogin ? 'Nie masz konta?' : 'Masz już konto?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
            </button>
          </p>
        </motion.div>
      </div>

      {/* Right - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center gradient-primary p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-primary-foreground"
        >
          <div className="mb-8">
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
              <BookOpen className="h-12 w-12 absolute bottom-4" />
              <Flame className="h-10 w-10 text-amber-300 absolute top-2" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Ucz się efektywniej</h2>
            <p className="text-primary-foreground/80 max-w-md">
              Learn Lantern wykorzystuje system SRS (Spaced Repetition System) i AI, 
              aby pomóc Ci zapamiętać więcej w krótszym czasie.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { value: '847', label: 'Pytań' },
              { value: '156', label: 'Tematów' },
              { value: '23', label: 'Roadmap' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="rounded-xl bg-white/10 backdrop-blur-sm p-4"
              >
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-primary-foreground/80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
