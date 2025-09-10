import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { LogoUploader } from "@/components/organization/LogoUploader";


const TIMEZONES: string[] = (typeof Intl !== 'undefined' && (Intl as any).supportedValuesOf)
  ? (Intl as any).supportedValuesOf('timeZone')
  : [
    'UTC',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Sao_Paulo',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Africa/Johannesburg',
  ];

export default function OrganizationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [languages, setLanguages] = useState<Tables<'languages'>[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Organization Settings | Admin";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Manage organization settings, branding, locale, and integrations');
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: orgData, error: orgError } = await supabase.rpc('get_current_user_org');
        if (orgError) throw orgError;
        setOrgId(orgData as string);

        const [{ data: lang }, { data: setRow }] = await Promise.all([
          supabase.from('languages').select('*').order('name'),
          supabase.from('organization_settings').select('*').eq('organization_id', orgData).limit(1).maybeSingle(),
        ]);
        setLanguages(lang || []);
        setSettings(
          setRow || {
            org_name: '',
            logo_url: '',
            default_language: null,
            timezone: 'UTC',
            email_from_name: '',
            email_from_email: '',
            slack_webhook_url: '',
            teams_webhook_url: '',
            sapience_hcm_url: '',
            sapience_hcm_username: '',
            sapience_hcm_password: '',
            sapience_hcm_token: '',
            sapience_hcm_token_expires_at: null,
            organization_id: orgData,
          }
        );
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const save = async () => {
    try {
      setLoading(true);

      // Ensure current organization id
      let currentOrgId = orgId;
      if (!currentOrgId) {
        const { data: orgData, error: orgError } = await supabase.rpc('get_current_user_org');
        if (orgError) throw orgError;
        currentOrgId = orgData as string;
        setOrgId(currentOrgId);
      }

      const { data: userResult } = await supabase.auth.getUser();
      const userId = userResult?.user?.id ?? null;

      const updateFields = {
        org_name: settings?.org_name ?? '',
        logo_url: settings?.logo_url ?? '',
        default_language: settings?.default_language ?? null,
        timezone: settings?.timezone ?? 'UTC',
        email_from_name: settings?.email_from_name ?? '',
        email_from_email: settings?.email_from_email ?? '',
        slack_webhook_url: settings?.slack_webhook_url ?? '',
        teams_webhook_url: settings?.teams_webhook_url ?? '',
        sapience_hcm_url: settings?.sapience_hcm_url ?? '',
        sapience_hcm_username: settings?.sapience_hcm_username ?? '',
        sapience_hcm_password: settings?.sapience_hcm_password ?? '',
      };

      console.log('Saving settings:', updateFields);

      if (settings?.id) {
        const { error } = await supabase
          .from('organization_settings')
          .update({ ...updateFields, updated_by: userId })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const insertPayload = {
          ...updateFields,
          organization_id: currentOrgId,
          created_by: userId,
        };
        const { error } = await supabase.from('organization_settings').insert(insertPayload);
        if (error) throw error;
      }
      toast({ title: 'Saved', description: 'Settings updated successfully' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message ?? 'Failed to save settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const testSapienceConnection = async () => {
    if (!settings?.sapience_hcm_url || !settings?.sapience_hcm_username || !settings?.sapience_hcm_password) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please fill in Sapience HCM URL, username, and password before testing', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      setTestingConnection(true);
      
      const { data, error } = await supabase.functions.invoke('sapience-hcm-test', {
        body: {
          hcmUrl: settings.sapience_hcm_url,
          username: settings.sapience_hcm_username,
          password: settings.sapience_hcm_password,
          organizationId: orgId,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({ 
          title: 'Connection Successful', 
          description: data.message 
        });
        
        // Refresh settings to get the updated token, but preserve form values
        const { data: settingsData } = await supabase
          .from('organization_settings')
          .select('sapience_hcm_token, sapience_hcm_token_expires_at')
          .eq('organization_id', orgId)
          .limit(1)
          .maybeSingle();
          
        if (settingsData) {
          setSettings(prev => ({ 
            ...prev, 
            sapience_hcm_token: settingsData.sapience_hcm_token,
            sapience_hcm_token_expires_at: settingsData.sapience_hcm_token_expires_at
          }));
        }
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (e: any) {
      console.error('Connection test error:', e);
      toast({ 
        title: 'Connection Failed', 
        description: e.message || 'Failed to connect to Sapience HCM', 
        variant: 'destructive' 
      });
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (<div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Branding, locale, email sender, and chat integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Organization Name</Label>
            <Input value={settings?.org_name ?? ''} onChange={(e) => setSettings((s: any) => ({ ...s, org_name: e.target.value }))} />
          </div>
          <div>
            <Label>Logo URL</Label>
            <div className="flex items-center gap-3">
              <Input value={settings?.logo_url ?? ''} onChange={(e) => setSettings((s: any) => ({ ...s, logo_url: e.target.value }))} />
              {orgId && (
                <LogoUploader orgId={orgId} onUploaded={(url) => setSettings((s: any) => ({ ...s, logo_url: url }))} />
              )}
            </div>
            {settings?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt="Organization logo preview" className="mt-2 h-12 w-auto" />
            )}
          </div>
          <div>
            <Label>Default Language</Label>
            <Select value={settings?.default_language ?? ''} onValueChange={(v) => setSettings((s: any) => ({ ...s, default_language: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.native_name} ({l.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Timezone</Label>
            <Select value={settings?.timezone ?? 'UTC'} onValueChange={(v) => setSettings((s: any) => ({ ...s, timezone: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Sender</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>From Name</Label>
            <Input value={settings?.email_from_name ?? ''} onChange={(e) => setSettings((s: any) => ({ ...s, email_from_name: e.target.value }))} />
          </div>
          <div>
            <Label>From Email</Label>
            <Input value={settings?.email_from_email ?? ''} onChange={(e) => setSettings((s: any) => ({ ...s, email_from_email: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chat Integrations */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Slack Incoming Webhook URL</Label>
              <Input value={settings?.slack_webhook_url ?? ''} onChange={(e) => setSettings((s: any) => ({ ...s, slack_webhook_url: e.target.value }))} />
            </div>
            <div>
              <Label>Microsoft Teams Incoming Webhook URL</Label>
              <Input value={settings?.teams_webhook_url ?? ''} onChange={(e) => setSettings((s: any) => ({ ...s, teams_webhook_url: e.target.value }))} />
            </div>
          </div>

          {/* Sapience HCM Integration */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Sapience HCM Integration</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Sapience HCM Instance URL</Label>
                <Input 
                  value={settings?.sapience_hcm_url ?? ''} 
                  onChange={(e) => setSettings((s: any) => ({ ...s, sapience_hcm_url: e.target.value }))}
                  placeholder="https://your-company.sapience.com"
                />
              </div>
              <div>
                <Label>Username</Label>
                <Input 
                  value={settings?.sapience_hcm_username ?? ''} 
                  onChange={(e) => setSettings((s: any) => ({ ...s, sapience_hcm_username: e.target.value }))}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input 
                  type="password"
                  value={settings?.sapience_hcm_password ?? ''} 
                  onChange={(e) => setSettings((s: any) => ({ ...s, sapience_hcm_password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <Label>Authentication Token</Label>
                <Input 
                  value={settings?.sapience_hcm_token ? "••••••••••••••••••••" : ""} 
                  readOnly
                  placeholder="Token will appear here after successful connection test"
                  className="bg-muted"
                />
              </div>
              <div className="flex items-end md:col-span-2">
                <Button 
                  onClick={testSapienceConnection} 
                  disabled={testingConnection || !settings?.sapience_hcm_url || !settings?.sapience_hcm_username || !settings?.sapience_hcm_password}
                  className="w-full md:w-auto"
                >
                  {testingConnection ? 'Testing Connection...' : 'Test Connection'}
                </Button>
              </div>
            </div>
            
            {/* Connection Status */}
            {settings?.sapience_hcm_token && settings?.sapience_hcm_token_expires_at && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center text-green-800">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Connected to Sapience HCM
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Token expires: {new Date(settings.sapience_hcm_token_expires_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={loading}>Save Settings</Button>
      </div>
    </div>
  );
}
