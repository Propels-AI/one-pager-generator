'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isLoading, handleSignOut } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/portal');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Welcome to your Dashboard,{' '}
          {user.signInDetails?.loginId || user.username}!
        </h1>
        <p className="mb-4 text-center text-gray-700 dark:text-gray-300">
          This is your protected dashboard area. More features will be added
          soon.
        </p>
        {/* Placeholder for future dashboard content */}
        <div className="mt-6 rounded-md border border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            Dashboard content will go here.
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleSignOut}
            variant="destructive"
            disabled={isLoading} // Disable button if auth state is changing
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
