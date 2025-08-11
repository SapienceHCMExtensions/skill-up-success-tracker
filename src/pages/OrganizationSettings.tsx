import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function OrganizationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<Tables<'languages'>[]>([]);
  const [settings, setSettings] = useState<any | null>(null);

  useEffect(() => {
    document.title = "Organization Settings | Admin";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Manage organization settings, branding, locale, and integrations');
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: lang }, { data: setRow }] = await Promise.all([
          supabase.from('languages').select('*').order('name'),
          supabase.from('organization_settings').select('*').limit(1).maybeSingle(),
        ]);
        setLanguages(lang || []);
        setSettings(setRow || { org_name: '', logo_url: '', default_language: null, timezone: 'UTC', email_from_name: '', email_from_email: '', slack_webhook_url: '', teams_webhook_url: '' });
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
      if (settings?.id) {
        const { error } = await supabase.from('organization_settings').update(settings).eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('organization_settings').insert(settings);
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
            <Input value={settings?.logo_url ?? ''} onChange={(e) => setSettings((s: any) => ({ ...s, logo_url: e.target.value }))} />
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
            <Input value={settings?.timezone ?? 'UTC'} onChange={(e) => setSettings((s: any) => ({ ...s, timezone: e.target.value }))} />
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
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Slack Incoming Webhook URL</Label>
            <Input value={settings?.slack_webhook_url ?? ''} onChange={(e) => setSettings((s: any) => ({ ...s, slack_webhook_url: e.target.value }))} />
          </div>
          <div>
            <Label>Microsoft Teams Incoming Webhook URL</Label>
            <Input value={settings?.teams_webhook_url ?? ''} onChange={(e) => setSettings((s: any) => ({ ...s, teams_webhook_url: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={loading}>Save Settings</Button>
      </div>
    </div>
  );
}
