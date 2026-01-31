import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={isMobile ? 'pt-14' : 'pl-64'}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};
