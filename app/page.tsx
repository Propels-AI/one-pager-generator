'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">First Page</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          The most intuitive Notion-style editor for creating stunning one-pagers.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild size="lg">
            <Link href="/editor">Start Creating</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard">My Pages</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
