// Root layout — minimal wrapper. Route group layouts add headers/navs.
'use client';
import './globals.css';
import { useEffect } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { AppProvider } from '@/context/app-provider';
import { Toaster } from '@/components/ui/toaster';
import ptMessages from '@/i18n/messages/pt.json';

function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }, []);
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <title>PixelFandom</title>
        <meta name="description" content="Plataforma de wikis multi-tenant" />
        <meta name="theme-color" content="#4BC5FF" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale="pt" messages={ptMessages}>
          <AppProvider>
            {children}
            <Toaster />
            <PwaRegister />
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
