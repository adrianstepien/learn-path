import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Map, 
  PlusCircle, 
  FileVideo, 
  BarChart3, 
  LogOut,
  GraduationCap,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { to: '/', icon: Home, label: 'Strona główna' },
  { to: '/learn', icon: Map, label: 'Nauka' },
  { to: '/editor', icon: PlusCircle, label: 'Edytor' },
  { to: '/questions', icon: HelpCircle, label: 'Baza pytań' },
  { to: '/import', icon: FileVideo, label: 'Import' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
];

export const Sidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-gradient">LearnFlow</span>
        </div>
        {isMobile && (
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== '/' && location.pathname.startsWith(item.to));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => isMobile && setIsOpen(false)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className={cn(
                'relative z-10 h-5 w-5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )} />
              <span className="relative z-10">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between px-3">
          <span className="text-xs text-muted-foreground">Motyw</span>
          <ThemeToggle />
        </div>
        <NavLink
          to="/login"
          onClick={() => isMobile && setIsOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>Wyloguj się</span>
        </NavLink>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border shadow-md"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Sidebar Overlay */}
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-border bg-card shadow-xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <SidebarContent />
    </aside>
  );
};
