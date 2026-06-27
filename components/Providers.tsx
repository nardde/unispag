'use client';

import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/Toast';
import { FeedbackManager } from '@/components/feedback/FeedbackManager';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ToastProvider>
        {children}
        <FeedbackManager />
      </ToastProvider>
    </ThemeProvider>
  );
}
