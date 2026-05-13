'use client';

import { useState } from 'react';
import MainNav from '@/components/main-nav';
import AuthDialog from '@/components/auth-dialog';

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-14 items-center border-b bg-background/80 px-4 backdrop-blur-sm z-50">
        <MainNav onLogin={() => setAuthOpen(true)} />
      </header>
      <main className="flex flex-1 flex-col">
        {children}
      </main>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
