import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const { user, signIn, signUp, loading: authLoading } = useAuth();

  const [enableAzure, setEnableAzure] = useState(false);
  const [enableSaml, setEnableSaml] = useState(false);
  const [samlDomain, setSamlDomain] = useState<string | null>(null);
  const [detectedProvider, setDetectedProvider] = useState<string | null>(null);
  const [showSsoHint, setShowSsoHint] = useState(false);

  const currentSubdomain = useMemo(() => {
    const host = window.location.hostname;
    // For Lovable preview URLs, always use 'default'
    if (host.includes('lovableproject.com') || host.includes('localhost')) {
      return 'default';
    }
    const parts = host.split('.');
    return parts.length > 2 ? parts[0] : 'default';
  }, []);

  useEffect(() => {
    // Load public SSO flags via secure function (no sensitive data exposed)
    (supabase as any)
      .rpc('get_public_sso_settings', { _subdomain: currentSubdomain })
      .then(({ data, error }: any) => {
        if (error) {
          console.warn('SSO flags unavailable for', currentSubdomain, error.message);
          return;
        }
        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          setEnableAzure(!!row.enable_azure);
          setEnableSaml(!!row.enable_saml);
          // Get SAML domain for smart detection
          if (row.saml_domain) {
            setSamlDomain(row.saml_domain);
          }
        }
      });
  }, [currentSubdomain]);

  // Smart provider detection based on email
  useEffect(() => {
    if (email && (enableAzure || enableSaml)) {
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (emailDomain) {
        // Check if email domain matches SAML domain
        if (enableSaml && samlDomain && emailDomain === samlDomain.toLowerCase()) {
          setDetectedProvider('saml');
          setShowSsoHint(true);
        } else if (enableAzure && emailDomain !== 'gmail.com' && emailDomain !== 'yahoo.com') {
          // Suggest Azure for business domains (not personal email providers)
          setDetectedProvider('azure');
          setShowSsoHint(true);
        } else {
          setDetectedProvider(null);
          setShowSsoHint(false);
        }
      }
    } else {
      setDetectedProvider(null);
      setShowSsoHint(false);
    }
  }, [email, enableAzure, enableSaml, samlDomain]);

  console.log('Auth page render - user:', user, 'authLoading:', authLoading);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dashboard">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (user) {
    console.log('User exists, should redirect:', user.email);
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Attempting login with:', email);

    try {
      if (isLogin) {
        const result = await signIn(email, password);
        console.log('Sign in result:', result);
        if (!result.error) {
          // Force redirect after successful login
          window.location.href = '/';
        }
      } else {
        const result = await signUp(email, password, name, orgName, subdomain);
        console.log('Sign up result:', result);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }

    setLoading(false);
  };

  const oauthSignIn = async (provider: 'google' | 'linkedin_oidc' | 'azure') => {
    setLoading(true);
    try {
      if (provider === 'azure') {
        // Use custom Azure SSO for multi-tenant support
        const response = await supabase.functions.invoke('azure-sso/initiate', {
          body: { 
            subdomain: currentSubdomain,
            email: email || undefined // Include email for better domain validation
          }
        });
        
        if (response.error) {
          console.error('Azure SSO error:', response.error);
          alert(`Azure SSO error: ${response.error.message || 'Unknown error'}`);
          return;
        }
        
        if (response.data?.authUrl) {
          window.location.href = response.data.authUrl;
        }
      } else {
        // Use standard OAuth for Google and LinkedIn
        await supabase.auth.signInWithOAuth({ 
          provider: provider as any, 
          options: { redirectTo: window.location.origin } 
        });
      }
    } catch (e) {
      console.error('OAuth error', e);
      alert('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const samlSignIn = async (emailToUse?: string) => {
    setLoading(true);
    try {
      let emailForSso = emailToUse || email;
      
      if (!emailForSso) {
        const input = window.prompt('Enter your work email to continue with SSO');
        if (!input) {
          setLoading(false);
          return;
        }
        emailForSso = input.trim();
      }
      
      if (!emailForSso.includes('@')) {
        alert('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Use custom SAML SSO for multi-tenant support
      const response = await supabase.functions.invoke('saml-sso/initiate', {
        body: { email: emailForSso, subdomain: currentSubdomain }
      });
      
      if (response.error) {
        console.error('SAML SSO error:', response.error);
        alert(`SAML SSO error: ${response.error.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      if (response.data?.ssoUrl) {
        window.location.href = response.data.ssoUrl;
      }
    } catch (e) {
      console.error('SSO error', e);
      alert('SSO authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSsoSuggestion = () => {
    if (detectedProvider === 'saml') {
      samlSignIn(email);
    } else if (detectedProvider === 'azure') {
      oauthSignIn('azure');
    }
  };
  return (
    <div className="min-h-screen bg-gradient-dashboard">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left side - Hero Image and Content */}
        <div className="hidden lg:flex flex-col justify-center items-center p-12">
          <div className="max-w-lg text-center space-y-6">
            <div className="mb-8">
              <img 
                src="/lovable-uploads/e3c12c37-7d1a-4e04-aa9f-eb17ab4941dc.png" 
                alt="Sapience HCM - Comprehensive HR Management Solutions"
                className="w-full h-auto rounded-lg shadow-elegant"
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Sapience HCM Training Management
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Comprehensive Human Capital Management platform featuring advanced training modules, 
                performance tracking, and seamless organizational development tools.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Learning & Development
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Performance Management
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Organization Management
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  HR Automation
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <Card className="w-full max-w-md shadow-elegant border-0 bg-card/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center font-semibold">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-center">
                {isLogin 
                  ? 'Sign in to access your training dashboard' 
                  : 'Join the Sapience HCM platform'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={!isLogin}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        type="text"
                        placeholder="e.g., Acme Inc."
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subdomain">Subdomain</Label>
                      <Input
                        id="subdomain"
                        type="text"
                        placeholder="acme"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                        required
                        pattern="^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$"
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">Your app subdomain (e.g., acme). No spaces. Letters, numbers, dashes.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                  {showSsoHint && detectedProvider && (
                    <div className="flex items-center gap-2 p-2 text-sm bg-blue-50 border border-blue-200 rounded-md">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-700">
                        We detected you can use {detectedProvider === 'saml' ? 'Company SSO' : 'Microsoft'} for faster sign-in.
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-blue-600 hover:text-blue-800"
                        onClick={handleSsoSuggestion}
                        disabled={loading}
                      >
                        Use SSO
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 font-medium" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px bg-border w-full" />
                <span className="text-xs text-muted-foreground">Or continue with</span>
                <div className="h-px bg-border w-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-11" 
                  onClick={() => oauthSignIn('google')}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    'Google'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-11" 
                  onClick={() => oauthSignIn('linkedin_oidc')}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    'LinkedIn'
                  )}
                </Button>
                {enableAzure && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`h-11 ${detectedProvider === 'azure' ? 'border-blue-300 bg-blue-50' : ''}`}
                    onClick={() => oauthSignIn('azure')}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <>
                        Microsoft
                        {detectedProvider === 'azure' && (
                          <span className="ml-1 text-xs text-blue-600">Recommended</span>
                        )}
                      </>
                    )}
                  </Button>
                )}
                {enableSaml && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`h-11 ${detectedProvider === 'saml' ? 'border-blue-300 bg-blue-50' : ''}`}
                    onClick={() => samlSignIn()}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <>
                        Company SSO
                        {detectedProvider === 'saml' && (
                          <span className="ml-1 text-xs text-blue-600">Recommended</span>
                        )}
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  {isLogin 
                    ? "New to Sapience? Create an account" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Hero Section */}
        <div className="lg:hidden flex flex-col items-center justify-center p-8">
          <div className="max-w-sm text-center space-y-4">
            <img 
              src="/lovable-uploads/e3c12c37-7d1a-4e04-aa9f-eb17ab4941dc.png" 
              alt="Sapience HCM Platform"
              className="w-full h-auto rounded-lg shadow-elegant mb-4"
            />
            <h2 className="text-xl font-semibold text-foreground">
              Sapience HCM Training
            </h2>
            <p className="text-sm text-muted-foreground">
              Advanced HR management and training solutions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}