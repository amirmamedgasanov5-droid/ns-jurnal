import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  public render() {
    const state = (this as any).state;
    if (state.hasError) {
      let errorMessage = "Gözlənilməz xəta baş verdi.";
      
      try {
        // Check if it's a Firestore JSON error
        const parsed = JSON.parse(state.error?.message || '');
        if (parsed.error) {
          errorMessage = `Giriş xətası: ${parsed.operationType} əməliyyatı ${parsed.path} yolunda. Giriş icazələrini yoxlayın.`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="h-full w-full flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-destructive/10 border border-destructive rounded-lg p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-destructive">Xəta baş verdi</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <Button onClick={() => window.location.reload()}>Səhifəni yenilə</Button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
