import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function SSOTesting() {
  const { userRole } = useAuth();
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [currentSubdomain] = useState(() => {
    const host = window.location.hostname;
    const parts = host.split('.');
    return parts.length > 2 ? parts[0] : 'default';
  });

  // Only admins can access this page
  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const testProviderDetection = async () => {
    if (!testEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setTesting(true);
    setTestResults(null);

    try {
      // Test provider detection
      const { data: detectionData, error: detectionError } = await (supabase as any)
        .rpc('detect_sso_provider', { 
          _email: testEmail, 
          _subdomain: currentSubdomain 
        });

      // Test domain validation
      const emailDomain = testEmail.split('@')[1];
      const { data: validationData, error: validationError } = await (supabase as any)
        .rpc('validate_sso_domain', { 
          _email: testEmail, 
          _subdomain: currentSubdomain,
          _provider: detectionData?.[0]?.provider || 'email'
        });

      // Get SSO settings
      const { data: ssoSettings, error: ssoError } = await (supabase as any)
        .rpc('get_public_sso_settings', { _subdomain: currentSubdomain });

      setTestResults({
        detection: {
          data: detectionData,
          error: detectionError
        },
        validation: {
          data: validationData,
          error: validationError
        },
        settings: {
          data: ssoSettings,
          error: ssoError
        },
        emailDomain,
        testEmail
      });

    } catch (error) {
      console.error('SSO test error:', error);
      alert('Testing failed. Check console for details.');
    } finally {
      setTesting(false);
    }
  };

  const testSSOFlow = async (provider: 'azure' | 'saml') => {
    if (!testEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setTesting(true);
    
    try {
      if (provider === 'azure') {
        const response = await supabase.functions.invoke('azure-sso/initiate', {
          body: { 
            subdomain: currentSubdomain,
            email: testEmail
          }
        });
        
        if (response.error) {
          alert(`Azure SSO Test Error: ${response.error.message}`);
        } else if (response.data?.authUrl) {
          // Open in new tab for testing
          window.open(response.data.authUrl, '_blank');
        }
      } else {
        const response = await supabase.functions.invoke('saml-sso/initiate', {
          body: { 
            email: testEmail, 
            subdomain: currentSubdomain 
          }
        });
        
        if (response.error) {
          alert(`SAML SSO Test Error: ${response.error.message}`);
        } else if (response.data?.ssoUrl) {
          // Open in new tab for testing
          window.open(response.data.ssoUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('SSO flow test error:', error);
      alert('SSO flow test failed. Check console for details.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SSO Testing & Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This tool helps test SSO configuration and provider detection for the <strong>{currentSubdomain}</strong> subdomain.
              Test results will open in new tabs to avoid disrupting the admin session.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="user@company.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={testProviderDetection}
              disabled={testing || !testEmail}
            >
              {testing ? 'Testing...' : 'Test Provider Detection'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => testSSOFlow('azure')}
              disabled={testing || !testEmail}
            >
              Test Azure SSO Flow
            </Button>
            <Button 
              variant="outline"
              onClick={() => testSSOFlow('saml')}
              disabled={testing || !testEmail}
            >
              Test SAML SSO Flow
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Provider Detection</h4>
              {testResults.detection.error ? (
                <Badge variant="destructive">Error: {testResults.detection.error.message}</Badge>
              ) : (
                <div className="space-y-2">
                  {testResults.detection.data?.map((result: any, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Badge variant={result.enabled ? "default" : "secondary"}>
                        {result.provider}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Domain: {result.domain} | Enabled: {result.enabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Domain Validation</h4>
              <Badge variant={testResults.validation.data ? "default" : "destructive"}>
                {testResults.validation.data ? 'Valid' : 'Invalid'}
              </Badge>
              {testResults.validation.error && (
                <p className="text-sm text-red-600 mt-1">
                  Error: {testResults.validation.error.message}
                </p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">SSO Settings</h4>
              {testResults.settings.error ? (
                <Badge variant="destructive">Error: {testResults.settings.error.message}</Badge>
              ) : (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <Badge variant={testResults.settings.data?.[0]?.enable_azure ? "default" : "secondary"}>
                      Azure: {testResults.settings.data?.[0]?.enable_azure ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Badge variant={testResults.settings.data?.[0]?.enable_saml ? "default" : "secondary"}>
                      SAML: {testResults.settings.data?.[0]?.enable_saml ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded text-xs">
              <strong>Raw Results:</strong>
              <pre className="mt-1 whitespace-pre-wrap">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}