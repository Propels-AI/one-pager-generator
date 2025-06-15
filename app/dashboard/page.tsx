'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchUserOnePagers, type OnePagerFromSchema as OnePagerEntity } from '@/lib/services/entityService';

export default function DashboardPage() {
  const { user, isLoading: authIsLoading, handleSignOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');

  const ownerUserId = user ? `USER#${user.userId}` : undefined;

  const {
    data: onePagers,
    isLoading: onePagersIsLoading,
    error: onePagersError,
    refetch: refetchOnePagers,
  } = useQuery<OnePagerEntity[], Error>({
    queryKey: ['onePagers', ownerUserId, activeTab],
    queryFn: () => {
      if (!ownerUserId) return Promise.resolve([]); // Or throw an error
      return fetchUserOnePagers(ownerUserId, activeTab);
    },
    enabled: !!ownerUserId && !authIsLoading, // Only run query if user is loaded and ownerUserId is available
  });

  useEffect(() => {
    if (!authIsLoading && !user) {
      router.replace('/auth/portal');
    }
  }, [user, authIsLoading, router]);

  // Effect to refetch when tab changes or user changes
  useEffect(() => {
    if (ownerUserId) {
      refetchOnePagers();
    }
  }, [activeTab, ownerUserId, refetchOnePagers]);

  if (authIsLoading) {
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
          Welcome to your Dashboard, {user.signInDetails?.loginId || user.username}!
        </h1>
        <p className="mb-8 text-center text-gray-700 dark:text-gray-300">Manage your one-pagers below.</p>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'PUBLISHED' | 'DRAFT')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="PUBLISHED">Published</TabsTrigger>
            <TabsTrigger value="DRAFT">Drafts</TabsTrigger>
          </TabsList>
          <TabsContent value="PUBLISHED">
            {onePagersIsLoading && <p className="py-4 text-center">Loading published one-pagers...</p>}
            {onePagersError && <p className="py-4 text-center text-red-500">Error: {onePagersError.message}</p>}
            {!onePagersIsLoading && !onePagersError && onePagers && onePagers.length === 0 && (
              <p className="py-4 text-center text-gray-500">No published one-pagers found.</p>
            )}
            {!onePagersIsLoading && !onePagersError && onePagers && onePagers.length > 0 && (
              <ul className="mt-4 space-y-2">
                {onePagers.map((pager) => (
                  <Link
                    key={pager.PK}
                    href={`/edit/${pager.PK.split('#')[1]}`}
                    className="block rounded-md border p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                  >
                    <li className="list-none">
                      <h3 className="font-semibold">{pager.internalTitle || 'Untitled'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last updated:{' '}
                        {pager.statusUpdatedAt ? new Date(pager.statusUpdatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                      {/* Add Manage Shares and Delete buttons here later */}
                    </li>
                  </Link>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="DRAFT">
            {onePagersIsLoading && <p className="py-4 text-center">Loading draft one-pagers...</p>}
            {onePagersError && <p className="py-4 text-center text-red-500">Error: {onePagersError.message}</p>}
            {!onePagersIsLoading && !onePagersError && onePagers && onePagers.length === 0 && (
              <p className="py-4 text-center text-gray-500">No draft one-pagers found.</p>
            )}
            {!onePagersIsLoading && !onePagersError && onePagers && onePagers.length > 0 && (
              <ul className="mt-4 space-y-2">
                {onePagers.map((pager) => (
                  <Link
                    key={pager.PK}
                    href={`/edit/${pager.PK.split('#')[1]}`}
                    className="block rounded-md border p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                  >
                    <li className="list-none">
                      <h3 className="font-semibold">{pager.internalTitle || 'Untitled'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last updated:{' '}
                        {pager.statusUpdatedAt ? new Date(pager.statusUpdatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                      {/* Add Manage Shares and Delete buttons here later */}
                    </li>
                  </Link>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleSignOut}
            variant="destructive"
            disabled={authIsLoading} // Disable button if auth state is changing
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
