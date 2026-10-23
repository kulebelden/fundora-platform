import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Fraunces, Playfair_Display, Plus_Jakarta_Sans, Sora, Space_Grotesk, Syne } from 'next/font/google';
import type { ReactNode } from 'react';
import { IosInstallPrompt } from '@/components/ios-install-prompt';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';
import { SplashWrapper } from './splash-wrapper';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const serif = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
  preload: false,
});

const display = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
  preload: false,
});

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-grotesk',
  preload: false,
});

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
  preload: false,
});

const syne = Syne({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-syne',
  preload: false,
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage',
  preload: false,
});

const fontVariables = [sans, serif, display, grotesk, sora, syne, bricolage].map((f) => f.variable).join(' ');

export const metadata: Metadata = {
  title: {
    default: 'HopeNest — Real People. Real Causes. Greater Impact.',
    template: '%s · HopeNest',
  },
  description:
    'HopeNest connects real people to real causes. Give and raise with bank-grade security and fully auditable, double-entry fund handling.',
  manifest: '/manifest.json',
  applicationName: 'HopeNest',
  appleWebApp: {
    capable: true,
    title: 'HopeNest',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: { telephone: false },
  other: {
    // Safari's Add to Home Screen reads these alongside the manifest.
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: 'HopeNest — Real People. Real Causes. Greater Impact.',
    description: 'Fund the causes that matter, with complete financial transparency.',
    siteName: 'HopeNest',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00A86B' },
    { media: '(prefers-color-scheme: dark)', color: '#002B66' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Providers>
          <SplashWrapper>
            {children}
            <Toaster />
          </SplashWrapper>
          <IosInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
