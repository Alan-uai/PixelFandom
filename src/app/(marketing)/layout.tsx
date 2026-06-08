'use client';

import { useState } from 'react';
import MainNav from '@/components/main-nav';
import AuthDialog from '@/components/auth-dialog';
import ThreeBackground from '@/components/marketing/three-background';

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col relative">
      <ThreeBackground />
      <header className="sticky top-0 flex h-14 items-center border-b border-border/40 bg-background/60 backdrop-blur-xl z-50">
        <MainNav onLogin={() => setAuthOpen(true)} />
      </header>
      <main className="flex flex-1 flex-col relative z-10">
        {children}
      </main>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
