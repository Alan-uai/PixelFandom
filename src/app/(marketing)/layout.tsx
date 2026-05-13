'use client';

import { useState } from 'react';
import MainNav from '@/components/main-nav';
import AuthDialog from '@/components/auth-dialog';
import RaidTimer from '@/components/raid-timer';
import CodesDisplay from '@/components/codes-display';
import LocationsDisplay from '@/components/locations-display';

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
      <div className="fixed top-14 w-full flex justify-between z-40 pointer-events-none px-4 md:px-6">
        <div className="flex-1 flex justify-start">
          <CodesDisplay />
        </div>
        <div className="flex-1 flex justify-center">
          <RaidTimer />
        </div>
        <div className="flex-1 flex justify-end">
          <LocationsDisplay />
        </div>
      </div>
      <main className="flex flex-1 flex-col p-4 md:p-6 pt-20">
        {children}
      </main>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
