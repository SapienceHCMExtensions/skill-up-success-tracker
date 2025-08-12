import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const id = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(id);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dashboard">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading && timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dashboard">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Still loading... Please try again.</p>
          <div className="flex gap-3 justify-center">
            <a href="/" className="underline">Reload</a>
            <a href="/auth" className="underline">Go to Sign In</a>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}