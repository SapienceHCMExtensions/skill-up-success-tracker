import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const error = searchParams.get('error');

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth?error=' + encodeURIComponent(error));
          return;
        }

        if (accessToken && (type === 'magiclink' || type === 'saml')) {
          // Set the session using the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            navigate('/auth?error=' + encodeURIComponent('Failed to establish session'));
            return;
          }

          // Redirect to dashboard
          navigate('/');
        } else {
          // Handle standard OAuth callback - let Supabase handle the URL parsing
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const urlParams = new URLSearchParams(window.location.search);
          
          const urlAccessToken = hashParams.get('access_token') || urlParams.get('access_token');
          const urlRefreshToken = hashParams.get('refresh_token') || urlParams.get('refresh_token');
          
          if (urlAccessToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: urlAccessToken,
              refresh_token: urlRefreshToken || '',
            });
            
            if (sessionError) {
              console.error('OAuth session error:', sessionError);
              navigate('/auth?error=' + encodeURIComponent(sessionError.message));
              return;
            }
          }

          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth?error=' + encodeURIComponent('Authentication failed'));
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dashboard">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}