import { useEffect, useState } from 'react';

/**
 * Redirect manager for coordinating OAuth flows
 * Prevents race conditions between AuthProvider and declarative components
 */

export type RedirectReason = 'pending-onepager' | 'pending-create' | 'return-to-path' | 'default-signin';

export interface RedirectRequest {
  to: string;
  reason: RedirectReason;
  replace?: boolean;
  data?: any;
}

class RedirectManager {
  private hasHandledOAuthRedirect = false;
  private pendingRedirect: RedirectRequest | null = null;
  private listeners: Set<(request: RedirectRequest | null) => void> = new Set();

  /**
   * Called by AuthProvider when OAuth sign-in is detected
   * This takes priority over component-level redirects
   */
  public handleOAuthRedirect(): RedirectRequest | null {
    if (this.hasHandledOAuthRedirect) {
      return null;
    }

    this.hasHandledOAuthRedirect = true;

    // Priority 1: Editor draft/publish flow
    const pendingOnePagerString = localStorage.getItem('pendingOnePager');
    if (pendingOnePagerString) {
      try {
        const pendingData = JSON.parse(pendingOnePagerString);
        const request: RedirectRequest = {
          to: '/editor',
          reason: 'pending-onepager',
          replace: true,
          data: pendingData,
        };
        this.setPendingRedirect(request);
        return request;
      } catch (error) {
        console.error('Failed to parse pendingOnePager:', error);
        localStorage.removeItem('pendingOnePager');
      }
    }

    // Priority 2: Legacy create flow
    const pendingCreateDataString = localStorage.getItem('pendingCreateOnePager');
    if (pendingCreateDataString) {
      try {
        const pendingData = JSON.parse(pendingCreateDataString);
        const request: RedirectRequest = {
          to: pendingData.returnTo || '/dashboard',
          reason: 'pending-create',
          replace: true,
          data: pendingData,
        };
        this.setPendingRedirect(request);
        return request;
      } catch (error) {
        console.error('Failed to parse pendingCreateOnePager:', error);
        localStorage.removeItem('pendingCreateOnePager');
      }
    }

    // Priority 3: Return to specific path
    const returnToAfterAuth = localStorage.getItem('returnToAfterAuth');
    if (returnToAfterAuth) {
      localStorage.removeItem('returnToAfterAuth');
      const request: RedirectRequest = {
        to: returnToAfterAuth,
        reason: 'return-to-path',
        replace: true,
      };
      this.setPendingRedirect(request);
      return request;
    }

    // No special redirect needed - components can handle default flow
    return null;
  }

  /**
   * Called by components to check if they should defer to OAuth redirect
   */
  public shouldDeferRedirect(): boolean {
    return this.hasHandledOAuthRedirect && this.pendingRedirect !== null;
  }

  /**
   * Called by components to register for redirect notifications
   */
  public subscribe(listener: (request: RedirectRequest | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Reset state (useful for testing)
   */
  public reset(): void {
    this.hasHandledOAuthRedirect = false;
    this.pendingRedirect = null;
    this.notifyListeners();
  }

  private setPendingRedirect(request: RedirectRequest): void {
    this.pendingRedirect = request;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.pendingRedirect));
  }
}

// Singleton instance
export const redirectManager = new RedirectManager();

/**
 * React hook for redirect manager integration
 * Provides type-safe, reactive access to redirect state
 */
export function useRedirectManager() {
  const [pendingRedirect, setPendingRedirect] = useState<RedirectRequest | null>(null);

  useEffect(() => {
    const unsubscribe = redirectManager.subscribe(setPendingRedirect);
    return unsubscribe;
  }, []);

  return {
    pendingRedirect,
    shouldDefer: redirectManager.shouldDeferRedirect(),
    reset: redirectManager.reset,
  };
}
