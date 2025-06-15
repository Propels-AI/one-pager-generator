'use client';

import { useEffect } from 'react';
import { Hub } from '@aws-amplify/core';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { useId, useState, FormEvent, SVGProps } from 'react';
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  type SignUpOutput,
} from 'aws-amplify/auth';
import { Loader2 } from 'lucide-react';

type AuthMode = 'signIn' | 'signUp' | 'confirmSignUp' | 'forgotPassword' | 'confirmForgotPassword';

interface AuthSignInDialogProps {
  onAuthSuccess?: () => void;
}

function AuthSignInDialogComponent({ onAuthSuccess }: AuthSignInDialogProps) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [signUpDetails, setSignUpDetails] = useState<SignUpOutput | null>(null);
  const [newPassword, setNewPassword] = useState(''); // For confirmForgotPassword mode
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const hubListenerCancel = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          console.log('AuthSignInDialog: Hub detected signedIn event.');
          if (onAuthSuccess) {
            onAuthSuccess();
          }
          break;
      }
    });

    return () => {
      hubListenerCancel();
    };
  }, [onAuthSuccess]);

  const handleAlertDismiss = () => {
    setShowSuccessAlert(false);
    setSuccessMessage('');
  };

  const executeSignIn = async () => {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password,
    });
    if (isSignedIn) {
      // Successfully signed in. AuthProvider will handle redirect.
      console.log('Sign in successful');
    } else {
      if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        setAuthMode('confirmSignUp');
        setError('Your account is unconfirmed. Please enter the code sent to your email.');
      } else {
        console.log('Sign in next step:', nextStep);
        setError(`Sign in requires further steps: ${nextStep?.signInStep || 'unknown'}`);
      }
    }
  };

  const formSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (authMode === 'signIn') {
        await executeSignIn();
      } else if (authMode === 'confirmSignUp') {
        await handleConfirmSignUp();
      } else if (authMode === 'confirmForgotPassword') {
        await handleConfirmForgotPassword();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false); // Ensure loading is stopped
      return;
    }
    try {
      const output = await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email },
        },
      });
      setSignUpDetails(output);
      if (output.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setAuthMode('confirmSignUp');
        setError(null); // Clear previous errors
      } else if (output.nextStep.signUpStep === 'DONE') {
        // Successfully signed up. AuthProvider will handle redirect.
        console.log('Sign up successful and complete.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (codeFromOtp?: string) => {
    setError(null);
    setIsLoading(true);

    if (authMode !== 'confirmSignUp') {
      setError('Cannot confirm sign up at this stage. Please try signing up again.');
      setAuthMode('signUp');
      setIsLoading(false);
      return;
    }

    if (signUpDetails && signUpDetails.nextStep.signUpStep !== 'CONFIRM_SIGN_UP') {
      setError('Cannot confirm sign up at this stage. Please try signing up again.');
      setAuthMode('signUp');
      setIsLoading(false);
      return;
    }

    const currentCode = codeFromOtp || confirmationCode;

    if (!currentCode || currentCode.length < 6) {
      setError('Invalid confirmation code. Please enter a 6-digit code.');
      setIsLoading(false);
      return;
    }

    try {
      await confirmSignUp({ username: email, confirmationCode: currentCode });

      setSuccessMessage('Account confirmed! Please sign in with your credentials.');
      setShowSuccessAlert(true);
      setAuthMode('signIn');
      setPassword('');
      setConfirmPassword('');
      setConfirmationCode('');
    } catch (err: any) {
      console.error('Confirm sign up error:', err);
      if (err.name === 'CodeMismatchException') {
        setError('The confirmation code you entered is incorrect. Please try again.');
      } else if (err.name === 'ExpiredCodeException') {
        setError('The confirmation code has expired. Please request a new one.');
      } else if (err.name === 'UserNotFoundException') {
        setError('This account could not be found. Please try signing up again.');
      } else if (err.name === 'TooManyFailedAttemptsException') {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.name === 'TooManyRequestsException') {
        setError('Too many requests. Please try again later.');
      } else {
        setError(err.message || 'An error occurred during confirmation. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await resendSignUpCode({ username: email });
      setSuccessMessage('Confirmation code resent. Please check your email.');
      setShowSuccessAlert(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordRequest = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword({ username: email });
      setAuthMode('confirmForgotPassword');
      setError('Password reset code sent. Check your email and enter the code below.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmForgotPassword = async () => {
    if (!email || !confirmationCode || !newPassword) {
      setError('Email, confirmation code, and new password are required.');
      return;
    }

    await confirmResetPassword({
      username: email,
      confirmationCode,
      newPassword,
    });
    setAuthMode('signIn');
    setEmail('');
    setPassword('');
    setNewPassword('');
    setConfirmationCode('');
    setError('Password successfully reset. Please sign in with your new password.');
  };

  return (
    <div className="w-full max-w-md p-6 space-y-6 bg-background text-foreground rounded-lg shadow-md border">
      {/* Header Section */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            <path d="M12 12h8" />
            <path d="M12 8h8" />
            <path d="M12 16h8" />
          </svg>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold leading-none tracking-tight">
            {authMode === 'signIn'
              ? 'Welcome back'
              : authMode === 'signUp'
                ? 'Create an account'
                : authMode === 'confirmSignUp'
                  ? 'Confirm your account'
                  : authMode === 'forgotPassword'
                    ? 'Reset your password'
                    : 'Confirm password reset'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {authMode === 'signIn'
              ? 'Enter your credentials to login.'
              : authMode === 'signUp'
                ? 'Create a new account to get started.'
                : authMode === 'confirmSignUp'
                  ? 'Enter the code sent to your email.'
                  : authMode === 'forgotPassword'
                    ? 'Enter your email to receive a reset code.'
                    : 'Enter the reset code and your new password.'}
          </p>
        </div>
      </div>

      {/* Form Section */}
      <form className="grid gap-4" onSubmit={formSubmitHandler}>
        <div className="space-y-4">
          {(authMode === 'signIn' ||
            authMode === 'signUp' ||
            authMode === 'forgotPassword' ||
            authMode === 'confirmForgotPassword') && (
            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>Email</Label>
              <Input
                id={`${id}-email`}
                type="email"
                placeholder="john.doe@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || authMode === 'confirmForgotPassword'}
              />
            </div>
          )}

          {(authMode === 'signIn' || authMode === 'signUp') && (
            <div className="space-y-2">
              <Label htmlFor={`${id}-password`}>Password</Label>
              <Input
                id={`${id}-password`}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>
          )}

          {authMode === 'signUp' && (
            <div className="space-y-2">
              <Label htmlFor={`${id}-confirm-password`}>Confirm Password</Label>
              <Input
                id={`${id}-confirm-password`}
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>
          )}

          {authMode === 'confirmForgotPassword' && (
            <div className="space-y-2">
              <Label htmlFor={`${id}-new-password`}>New Password</Label>
              <Input
                id={`${id}-new-password`}
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter new password"
              />
            </div>
          )}

          {/* Confirmation Code Input (OTP) (shown in confirmSignUp and confirmForgotPassword) */}
          {(authMode === 'confirmSignUp' || authMode === 'confirmForgotPassword') && (
            <div className="space-y-2">
              <Label htmlFor={`${id}-confirmation-code`}>Confirmation Code</Label>
              <InputOTP
                maxLength={6}
                value={confirmationCode}
                onChange={(value) => setConfirmationCode(value)}
                disabled={isLoading}
                name={`${id}-confirmation-code`}
                id={`${id}-confirmation-code`}
                onComplete={(value) => {
                  if (authMode === 'confirmSignUp') {
                    setConfirmationCode(value);
                    handleConfirmSignUp(value);
                  }
                }}
              >
                <InputOTPGroup className="w-full justify-center">
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {authMode === 'confirmSignUp' && (
                <div className="text-center text-sm text-muted-foreground">
                  <span>Didn't get a code? </span>
                  <Button
                    variant="link"
                    type="button"
                    className="p-0 h-auto font-normal text-primary hover:underline disabled:opacity-50 inline-flex items-center"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    {isLoading && authMode === 'confirmSignUp' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send code again.
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {authMode === 'signIn' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${id}-remember-me`}
                checked={rememberMe}
                onCheckedChange={(checkedState) => setRememberMe(Boolean(checkedState))}
                disabled={isLoading}
              />
              <label
                htmlFor={`${id}-remember-me`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </label>
            </div>
            <Button
              variant="link"
              type="button"
              onClick={() => {
                setAuthMode('forgotPassword');
                setError(null);
                setPassword('');
                setConfirmPassword('');
                setNewPassword('');
                setConfirmationCode('');
              }}
              className="p-0 h-auto text-sm"
              disabled={isLoading}
            >
              Forgot password?
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-500 text-center">{error}</p>}

        <Button
          type={authMode === 'signUp' || authMode === 'forgotPassword' ? 'button' : 'submit'}
          className="w-full"
          disabled={isLoading}
          onClick={
            authMode === 'signUp'
              ? handleSignUp
              : authMode === 'forgotPassword'
                ? handleForgotPasswordRequest
                : undefined
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {authMode === 'signIn'
                ? 'Signing In...'
                : authMode === 'signUp'
                  ? 'Creating Account...'
                  : authMode === 'confirmSignUp'
                    ? 'Confirming...'
                    : authMode === 'forgotPassword'
                      ? 'Sending Code...'
                      : 'Resetting Password...'}
            </>
          ) : authMode === 'signIn' ? (
            'Sign In'
          ) : authMode === 'signUp' ? (
            'Create Account'
          ) : authMode === 'confirmSignUp' ? (
            'Confirm Account'
          ) : authMode === 'forgotPassword' ? (
            'Send Reset Code'
          ) : (
            'Reset Password'
          )}
        </Button>

        {authMode === 'signIn' && (
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Button
              variant="link"
              type="button"
              className="p-0 h-auto font-normal disabled:opacity-50"
              onClick={() => {
                setAuthMode('signUp');
                setError(null);
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={isLoading}
            >
              Sign Up
            </Button>
          </p>
        )}

        {authMode === 'signUp' && (
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Button
              variant="link"
              type="button"
              className="p-0 h-auto font-normal disabled:opacity-50"
              onClick={() => {
                setAuthMode('signIn');
                setError(null);
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </p>
        )}
        {(authMode === 'forgotPassword' || authMode === 'confirmForgotPassword' || authMode === 'confirmSignUp') && (
          <p className="text-sm text-center text-muted-foreground">
            Back to{' '}
            <Button
              variant="link"
              type="button"
              className="p-0 h-auto font-normal disabled:opacity-50"
              onClick={() => {
                setAuthMode('signIn');
                setError(null);
                setPassword('');
                setConfirmPassword('');
                setNewPassword('');
                setConfirmationCode('');
              }}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </p>
        )}
      </form>

      {showSuccessAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-50">
          <Alert duration={5000} onDismiss={handleAlertDismiss} showCloseButton>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        </div>
      )}
      {authMode !== 'confirmSignUp' && (
        <>
          <div className="flex items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            <span className="text-xs text-muted-foreground">Or</span>
          </div>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            disabled={isLoading}
            // onClick={() => handleOAuthSignIn('google')} // Placeholder for Google OAuth
          >
            <GoogleIcon className="size-4" aria-hidden={true} />
            <span>Login with Google</span>
          </Button>
        </>
      )}
    </div>
  );
}

const GoogleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
  </svg>
);

export { AuthSignInDialogComponent as AuthSignInDialog };
