'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import { Hub } from '@aws-amplify/core';
import {
  getCurrentUser,
  fetchUserAttributes,
  signOut,
  type AuthUser,
  type FetchUserAttributesOutput,
} from 'aws-amplify/auth';
import outputs from '@/amplify_outputs.json';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

Amplify.configure(outputs, { ssr: true });
interface AuthContextType {
  user: AuthUser | null;
  userProfile: FetchUserAttributesOutput | null;
  isLoading: boolean;
  handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<FetchUserAttributesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkCurrentUser = async () => {
      setIsLoading(true);
      try {
        const cognitoUser = await getCurrentUser();
        setUser(cognitoUser);
        if (cognitoUser) {
          const attributes = await fetchUserAttributes();
          setUserProfile(attributes);
        }
      } catch (error) {
        setUser(null);
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkCurrentUser();

    const hubListenerCancel = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          // Re-check user and fetch attributes, then handle redirect
          checkCurrentUser().then(() => {
            try {
              // Check for returnToAfterAuth (for protected pages like editor)
              const returnToAfterAuth = localStorage.getItem('returnToAfterAuth');

              // Check for legacy pendingCreateOnePager (old key)
              const pendingCreateDataString = localStorage.getItem('pendingCreateOnePager');
              // Check for new pendingOnePager key (used by editor)
              const pendingOnePagerString = localStorage.getItem('pendingOnePager');

              if (returnToAfterAuth) {
                localStorage.removeItem('returnToAfterAuth');
                router.push(returnToAfterAuth);
              } else if (pendingCreateDataString) {
                const pendingData = JSON.parse(pendingCreateDataString);
                if (pendingData.returnTo) {
                  router.push(pendingData.returnTo);
                } else {
                  router.push('/dashboard');
                }
              } else if (pendingOnePagerString) {
                // Redirect to editor when there's pending one-pager data
                // The editor page will handle processing the pending data
                router.push('/editor');
              } else {
                router.push('/dashboard');
              }
            } catch (error) {
              // Fallback redirect to dashboard on any localStorage parsing errors
              router.push('/dashboard');
            }
          });
          break;
        case 'signedOut':
          setUser(null);
          setUserProfile(null);
          setIsLoading(false);

          // Show success message for sign out (with slight delay to ensure it shows after any auth wall messages)
          setTimeout(() => {
            toast.success('Successfully signed out', {
              description: 'You have been signed out of your account.',
            });
          }, 100);

          router.push('/sign-in');
          break;
      }
    });

    // Cleanup listener on component unmount
    return () => {
      hubListenerCancel();
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, isLoading, handleSignOut }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as AuthContextType & { handleSignOut: () => Promise<void> };
};
