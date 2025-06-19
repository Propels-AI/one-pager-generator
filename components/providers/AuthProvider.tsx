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
import 'aws-amplify/auth/enable-oauth-listener';
import outputs from '@/amplify_outputs.json';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { redirectManager } from '@/lib/utils/redirectManager';

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
    const checkCurrentUser = async (fromHubEvent = false) => {
      // Only show loading on initial check, not on Hub events
      if (!fromHubEvent) {
        setIsLoading(true);
      }
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

    checkCurrentUser(false);

    const hubListenerCancel = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          // Re-check user and fetch attributes, then handle conditional redirects
          checkCurrentUser(true).then(() => {
            try {
              // Clean up OAuth callback URL parameters
              if (typeof window !== 'undefined' && window.location.search) {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('code') || urlParams.has('state')) {
                  // Clean URL by replacing with clean path
                  window.history.replaceState({}, '', window.location.pathname);
                }
              }

              // Use professional redirect manager to coordinate OAuth redirects
              const redirectRequest = redirectManager.handleOAuthRedirect();

              if (redirectRequest) {
                if (redirectRequest.replace) {
                  router.replace(redirectRequest.to);
                } else {
                  router.push(redirectRequest.to);
                }
              }
            } catch (error) {
              // Silently handle error - redirect manager will handle fallbacks
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
