import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthWall } from '@/lib/hooks/useAuthWall';
import { Loader2 } from 'lucide-react';
import { redirectManager } from '@/lib/utils/redirectManager';

interface AuthComponentProps {
  children: React.ReactNode;
}

interface RedirectToSignInProps {
  redirectMessage?: string;
  redirectDescription?: string;
  returnTo?: string;
  authPath?: string;
  showToast?: boolean;
}

/**
 * Renders children only when user is signed in
 * Following Clerk's declarative component pattern
 *
 * @example
 * ```tsx
 * <SignedIn>
 *   <Dashboard />
 * </SignedIn>
 * ```
 */
export function SignedIn({ children }: AuthComponentProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return isSignedIn ? <>{children}</> : null;
}

/**
 * Renders children only when user is NOT signed in
 * Following Clerk's declarative component pattern
 *
 * @example
 * ```tsx
 * <SignedOut>
 *   <SignInButton />
 * </SignedOut>
 * ```
 */
export function SignedOut({ children }: AuthComponentProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return !isSignedIn ? <>{children}</> : null;
}

/**
 * Automatically redirects to sign-in when user is not authenticated
 * Following Clerk's component pattern
 *
 * @example
 * ```tsx
 * <SignedOut>
 *   <RedirectToSignIn />
 * </SignedOut>
 * ```
 */
export function RedirectToSignIn({
  redirectMessage = 'Authentication Required',
  redirectDescription = 'You need to sign in to access this page.',
  returnTo,
  authPath = '/sign-in',
  showToast = true,
}: RedirectToSignInProps) {
  const { shouldRender } = useAuthWall({
    redirectMessage,
    redirectDescription,
    returnTo,
    authPath,
    showToast,
    autoRedirect: true,
  });

  // This component doesn't render anything - it just handles redirect
  return null;
}

/**
 * Declarative redirect component for authenticated users
 * Following Clerk's component pattern
 *
 * @example
 * ```tsx
 * <SignedIn>
 *   <RedirectToDashboard />
 * </SignedIn>
 * ```
 */
interface RedirectToDashboardProps {
  to?: string;
  replace?: boolean;
}

export function RedirectToDashboard({ to = '/dashboard', replace = true }: RedirectToDashboardProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [hasHandledRedirect, setHasHandledRedirect] = React.useState(false);

  React.useEffect(() => {
    // Only process once when auth is loaded and user is signed in
    if (!isLoaded || !isSignedIn || hasHandledRedirect) return;

    // Check if redirect manager is handling OAuth-specific redirects
    if (redirectManager.shouldDeferRedirect()) {
      setHasHandledRedirect(true);
      return;
    }

    setHasHandledRedirect(true);

    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [isLoaded, isSignedIn, hasHandledRedirect, router, to, replace]);

  // Render a loading state while redirect happens
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Higher-order component for protecting entire pages
 * Following Clerk's pattern but as a wrapper component
 *
 * @example
 * ```tsx
 * <ProtectPage>
 *   <DashboardContent />
 * </ProtectPage>
 * ```
 */
export function ProtectPage({ children }: AuthComponentProps) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

/**
 * Loading component for auth state
 * Can be customized or replaced
 */
export function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-lg">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Guard component that conditionally renders based on auth state
 * More flexible than SignedIn/SignedOut
 *
 * @example
 * ```tsx
 * <AuthGuard
 *   fallback={<LoginPrompt />}
 *   loading={<CustomLoader />}
 * >
 *   <ProtectedContent />
 * </AuthGuard>
 * ```
 */
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  redirectOnUnauthenticated?: boolean;
  redirectOptions?: RedirectToSignInProps;
}

export function AuthGuard({
  children,
  fallback,
  loading = <AuthLoading />,
  redirectOnUnauthenticated = false,
  redirectOptions,
}: AuthGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <>{loading}</>;
  }

  if (!isSignedIn) {
    if (redirectOnUnauthenticated) {
      return <RedirectToSignIn {...redirectOptions} />;
    }
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
