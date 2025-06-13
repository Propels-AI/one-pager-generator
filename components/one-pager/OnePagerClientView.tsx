'use client';

import dynamic from 'next/dynamic';
import type { PartialBlock } from '@blocknote/core';

// Dynamically import the Preview component with SSR turned off.
// This is crucial because the underlying BlockNote editor is not SSR-compatible.
const Preview = dynamic(() => import('@/components/preview').then((mod) => mod.Preview), {
  ssr: false,
  loading: () => (
    <div className="p-4 border rounded-md min-h-[calc(100vh-10rem)] flex items-center justify-center text-muted-foreground">
      Loading Preview...
    </div>
  ),
});

interface OnePagerClientViewProps {
  content: PartialBlock[];
}

export function OnePagerClientView({ content }: OnePagerClientViewProps) {
  return <Preview content={content} />;
}
