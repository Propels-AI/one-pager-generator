import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAmplifyAuth } from '@/components/providers/AuthProvider';
import { signOut } from 'aws-amplify/auth';
import { toast } from 'sonner';

interface AuthWallOptions {
  /**
   * Custom message to show when redirecting unauthenticated users
   */
  redirectMessage?: string;
  /**
   * Custom description for the toast
   */
  redirectDescription?: string;
  /**
   * Where to redirect after successful authentication
   * If not provided, will use current path
   */
  returnTo?: string;
  /**
   * Where to redirect unauthenticated users
   * Defaults to '/sign-in'
   */
  authPath?: string;
  /**
   * Whether to show a toast message on redirect
   * Defaults to true
   */
  showToast?: boolean;
  /**
   * Whether to automatically redirect or just return auth state
   * Defaults to true (auto-redirect)
   */
  autoRedirect?: boolean;
}

/**
 * Enhanced auth hook following Clerk's DX patterns
 *
 * @param options - Configuration options for the auth wall
 * @returns Object containing auth state and helper functions
 *
 * @example
 * ```tsx
 * // Basic usage - protects the current route
 * const { isSignedIn, user, isLoaded } = useAuth();
 *
 * // Auth wall with custom options
 * const { isSignedIn, user, isLoaded, protect } = useAuthWall({
 *   redirectMessage: 'Please sign in to access your dashboard',
 *   returnTo: '/dashboard/settings'
 * });
 *
 * // Manual protection (no auto-redirect)
 * const { isSignedIn, protect } = useAuthWall({ autoRedirect: false });
 * if (!isSignedIn) return protect(); // Manually trigger redirect
 * ```
 */
export function useAuthWall(options: AuthWallOptions = {}) {
  const { user, isLoading: isAuthLoading } = useAmplifyAuth();
  const router = useRouter();

  const {
    redirectMessage = 'Authentication Required',
    redirectDescription = 'You need to sign in to access this page.',
    returnTo,
    authPath = '/sign-in',
    showToast = true,
    autoRedirect = true,
  } = options;

  const isSignedIn = !!user;
  const isLoaded = !isAuthLoading; // Following Clerk's naming

  const protect = () => {
    // Determine the return path
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const redirectPath = returnTo || currentPath;

    // Store return path for after authentication
    if (redirectPath) {
      localStorage.setItem('returnToAfterAuth', redirectPath);
    }

    // Show toast notification if enabled
    if (showToast) {
      toast.error(redirectMessage, {
        description: redirectDescription,
      });
    }

    // Redirect to auth page
    router.push(authPath);
  };

  useEffect(() => {
    // Only auto-redirect if enabled and auth loading is complete and user is not authenticated
    if (autoRedirect && !isAuthLoading && !isSignedIn) {
      protect();
    }
  }, [isAuthLoading, isSignedIn, autoRedirect]);

  return {
    user,
    isSignedIn, // Clerk's naming convention
    isLoaded, // Clerk's naming convention
    isLoading: isAuthLoading, // Keep backward compatibility
    isAuthenticated: isSignedIn, // Keep backward compatibility
    /**
     * Whether the component should render content
     * Returns false if still loading or if user needs to be redirected
     */
    shouldRender: !isAuthLoading && isSignedIn,
    /**
     * Manually trigger auth protection/redirect
     */
    protect,
  };
}

/**
 * Simplified auth hook that just returns auth state (Clerk-style)
 * Use this when you just need to check auth status without protection
 */
export function useAuth() {
  const { user, isLoading } = useAmplifyAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Success toast will be handled by AuthProvider's Hub listener
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Sign out failed', {
        description: 'Please try again.',
      });
    }
  };

  return {
    user,
    isSignedIn: !!user,
    isLoaded: !isLoading,
    userId: user?.userId,
    signOut: handleSignOut,
  };
}

/**
 * User-focused hook (Clerk-style)
 * Returns user data and loading state
 */
export function useUser() {
  const { user, isLoading } = useAmplifyAuth();

  return {
    user,
    isLoaded: !isLoading,
  };
}

/**
 * Utility function to manually trigger auth wall redirect
 * Useful for programmatic redirects (e.g., after API errors)
 */
export function redirectToAuth(
  options: Pick<AuthWallOptions, 'redirectMessage' | 'redirectDescription' | 'returnTo' | 'authPath' | 'showToast'> = {}
) {
  const {
    redirectMessage = 'Authentication Required',
    redirectDescription = 'Please sign in to continue.',
    returnTo,
    authPath = '/sign-in',
    showToast = true,
  } = options;

  // Store return path
  if (returnTo) {
    localStorage.setItem('returnToAfterAuth', returnTo);
  }

  // Show toast
  if (showToast) {
    toast.error(redirectMessage, {
      description: redirectDescription,
    });
  }

  // Redirect (need to be called within a component that has access to router)
  if (typeof window !== 'undefined') {
    window.location.href = authPath;
  }
}
