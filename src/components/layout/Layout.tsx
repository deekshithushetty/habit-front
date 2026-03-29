import React from 'react';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNav = true }) => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50">
      <main className={`max-w-lg mx-auto px-4 pt-4 ${showNav ? 'pb-32' : ''}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default Layout;