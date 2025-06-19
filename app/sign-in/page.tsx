'use client';

import React from 'react';
import '@aws-amplify/ui-react/styles.css';
import { SignedIn, SignedOut, RedirectToDashboard } from '@/components/auth/AuthComponents';
import { AuthSignInDialog } from '@/components/ui/AuthSignInDialog';

export default function SignInPage() {
  return (
    <>
      <SignedIn>
        <RedirectToDashboard />
      </SignedIn>
      <SignedOut>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
          <AuthSignInDialog />
        </div>
      </SignedOut>
    </>
  );
}
