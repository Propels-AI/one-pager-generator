'use client';

import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light" // Force light theme for consistent minimalist styling
      className="toaster group"
      toastOptions={{
        classNames: {
          success: 'sonner-toast-success-icon',
          error: 'sonner-toast-error-icon',
        },
      }}
      style={
        {
          // Base toast styles
          '--normal-bg': '#ffffff',
          '--normal-text': '#000000',
          '--normal-border': '#e5e5e5',

          // Success state styles (overriding to be black and white)
          '--success-bg': '#ffffff',
          '--success-text': '#000000',

          // Error state styles (overriding to be black and white)
          '--error-bg': '#ffffff',
          '--error-text': '#000000',

          // Action button styles
          '--action-button-bg': '#000000',
          '--action-button-text': '#ffffff',

          // Cancel button styles
          '--cancel-button-bg': '#f0f0f0',
          '--cancel-button-text': '#000000',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
