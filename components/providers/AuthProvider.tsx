'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
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

Amplify.configure(outputs, { ssr: true }); // Enable SSR for Amplify

interface AuthContextType {
  user: AuthUser | null;
  userProfile: FetchUserAttributesOutput | null; // To store attributes like email, custom attributes
  isLoading: boolean;
  handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] =
    useState<FetchUserAttributesOutput | null>(null);
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
          router.push('/dashboard'); // Redirect to dashboard
          break;
        case 'signedOut':
          setUser(null);
          setUserProfile(null);
          setIsLoading(false); // Reset loading state
          router.push('/auth/portal'); // Ensure redirection
          break;
        // Add other cases like 'signUp', 'autoSignIn' if needed
      }
    });

    // Cleanup listener on component unmount
    return () => {
      hubListenerCancel();
    };
  }, []);

  // Placeholder for signOut function - to be implemented fully later
  const handleSignOut = async () => {
    setIsLoading(true); // Set loading true at the start of sign out
    try {
      await signOut();
      // The Hub listener for 'signedOut' will now handle setting user to null,
      // setting isLoading to false, and the redirect.
      // router.push('/auth/portal'); // This can be removed if Hub listener handles it reliably
    } catch (error) {
      console.error('Error signing out: ', error);
      setIsLoading(false); // Reset loading state in case of error
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, userProfile, isLoading, handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as AuthContextType & { handleSignOut: () => Promise<void> };
};
