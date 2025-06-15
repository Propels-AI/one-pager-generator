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
          checkCurrentUser(); // Re-check user and fetch attributes
          try {
            const pendingDataString = localStorage.getItem('pendingCreateOnePager');
            if (pendingDataString) {
              const pendingData = JSON.parse(pendingDataString);
              if (pendingData.returnTo) {
                console.log('AuthProvider: Redirecting to stored returnTo path:', pendingData.returnTo);
                router.push(pendingData.returnTo);
              } else {
                router.push('/dashboard');
              }
            } else {
              router.push('/dashboard');
            }
          } catch (error) {
            console.error('AuthProvider: Error reading or parsing localStorage for redirect:', error);
            router.push('/dashboard');
          }
          break;
        case 'signedOut':
          setUser(null);
          setUserProfile(null);
          setIsLoading(false);
          router.push('/auth/portal');
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
      console.error('Error signing out: ', error);
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
