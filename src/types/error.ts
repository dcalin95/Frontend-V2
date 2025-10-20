export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: number | null;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo; errorId: number }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorReport {
  errorId: number;
  error: string;
  errorInfo: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

export interface ErrorService {
  reportError: (errorReport: ErrorReport) => Promise<void>;
  getErrorById: (errorId: number) => Promise<ErrorReport | null>;
} 