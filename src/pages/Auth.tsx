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
  const {
    user,
    signIn,
    signUp,
    loading: authLoading
  } = useAuth();
  console.log('Auth page render - user:', user, 'authLoading:', authLoading);
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-dashboard">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking authentication...</p>
        </div>
      </div>;
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
  return <div className="min-h-screen flex items-center justify-center bg-gradient-dashboard px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center bg-white">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? 'Enter your credentials to access the Training Management System' : 'Create an account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} required={!isLogin} />
              </div>}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="bg-white" />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary hover:underline">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>;
}