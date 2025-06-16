import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TanstackQueryProvider } from '@/components/providers/TanstackQueryProvider';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'First Page',
    template: '%s | First Page',
  },
  description:
    'The most intuitive Notion-style editor for creating stunning one-pagers. Perfect for sales, pitches, and presentations.',
  keywords: ['notion editor', 'one-pager', 'block editor', 'presentations', 'pitch deck', 'portfolio', 'first page'],
  authors: [{ name: 'First Page' }],
  openGraph: {
    title: 'First Page - Notion-Style One-Pager Editor',
    description: 'The most intuitive editor for creating stunning one-pagers with Notion-style blocks',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TanstackQueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </TanstackQueryProvider>
          <SonnerToaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
