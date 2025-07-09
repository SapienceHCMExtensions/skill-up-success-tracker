import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('kannan.srinivasan.at@outlook.com'); // Pre-fill for testing
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp, loading: authLoading } = useAuth();

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
        const result = await signUp(email, password, name);
        console.log('Sign up result:', result);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }

    setLoading(false);
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