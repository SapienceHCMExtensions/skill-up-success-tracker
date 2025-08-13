import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function SSOSettings() {
  const { userRole, employeeProfile, currentSubdomain } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [enableAzure, setEnableAzure] = useState(false);
  const [azureClientId, setAzureClientId] = useState("");
  const [azureClientSecret, setAzureClientSecret] = useState("");
  const [azureTenantUrl, setAzureTenantUrl] = useState("");
  const [azureCallbackUrl, setAzureCallbackUrl] = useState("");
  const [enableSaml, setEnableSaml] = useState(false);
  const [samlDomain, setSamlDomain] = useState("");
  const [samlCallbackUrl, setSamlCallbackUrl] = useState("");

  const subdomain = useMemo(() => currentSubdomain || "default", [currentSubdomain]);

  useEffect(() => {
    // Fetch existing settings for this subdomain (admin-only via secure RPC)
    const fetchSettings = async () => {
      const { data, error } = await (supabase as any)
        .rpc('get_admin_sso_settings', { _subdomain: subdomain });

      if (error) {
        console.error('Failed to load admin SSO settings', error);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setEnableAzure(!!row.enable_azure);
        setAzureClientId(row.azure_client_id || "");
        setAzureClientSecret(row.azure_client_secret || "");
        setAzureTenantUrl(row.azure_tenant_url || "");
        setAzureCallbackUrl(row.azure_callback_url || "");
        setEnableSaml(!!row.enable_saml);
        setSamlDomain(row.saml_domain || "");
        setSamlCallbackUrl(row.saml_callback_url || "");
      }
    };
    fetchSettings();
  }, [subdomain]);

  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  const handleSave = async () => {
    if (!employeeProfile?.organization_id) return;
    setLoading(true);

    const payload = {
      organization_id: employeeProfile.organization_id,
      subdomain,
      enable_azure: enableAzure,
      azure_client_id: azureClientId || null,
      azure_client_secret: azureClientSecret || null,
      azure_tenant_url: azureTenantUrl || null,
      azure_callback_url: azureCallbackUrl || null,
      enable_saml: enableSaml,
      saml_domain: samlDomain || null,
      saml_callback_url: samlCallbackUrl || null,
    };

    const { error } = await (supabase as any)
      .from("sso_settings")
      .upsert(payload, { onConflict: "organization_id" });

    setLoading(false);

    if (error) {
      console.error(error);
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "SSO settings saved", description: "Your identity options were updated." });
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">SSO & Identity</h1>
        <p className="text-muted-foreground">Enable Microsoft (Azure AD) and SAML SSO for your organization. Secrets must be configured in Supabase Auth providers.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Microsoft (Azure AD)</CardTitle>
            <CardDescription>Store Azure OAuth settings securely, then configure the provider in Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableAzure">Enable Azure AD</Label>
                <p className="text-sm text-muted-foreground">Show the Microsoft button on the login page.</p>
              </div>
              <Switch id="enableAzure" checked={enableAzure} onCheckedChange={setEnableAzure} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azureClientId">Application (client) ID</Label>
              <Input id="azureClientId" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={azureClientId} onChange={(e) => setAzureClientId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azureClientSecret">Secret Value</Label>
              <Input id="azureClientSecret" type="password" placeholder="••••••••••" value={azureClientSecret} onChange={(e) => setAzureClientSecret(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azureTenantUrl">Azure Tenant URL (optional)</Label>
              <Input id="azureTenantUrl" placeholder="https://login.microsoftonline.com/<tenant-id>" value={azureTenantUrl} onChange={(e) => setAzureTenantUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azureCallbackUrl">Callback URL (for OAuth)</Label>
              <Input id="azureCallbackUrl" placeholder={`${window.location.origin} or your custom domain`} value={azureCallbackUrl} onChange={(e) => setAzureCallbackUrl(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Azure Settings"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SAML SSO</CardTitle>
            <CardDescription>Configure the SAML SSO domain to initiate the flow. Full SAML provider must be configured in Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableSaml">Enable SAML</Label>
                <p className="text-sm text-muted-foreground">Show the SAML SSO button on the login page.</p>
              </div>
              <Switch id="enableSaml" checked={enableSaml} onCheckedChange={setEnableSaml} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="samlDomain">SSO Email Domain</Label>
              <Input id="samlDomain" placeholder="yourcompany.com" value={samlDomain} onChange={(e) => setSamlDomain(e.target.value)} />
              <p className="text-xs text-muted-foreground">Users must belong to this email domain to use SAML sign-in.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="samlCallbackUrl">Callback URL (ACS URL)</Label>
              <Input id="samlCallbackUrl" placeholder={`${window.location.origin}/auth/v1/sso/callback`} value={samlCallbackUrl} onChange={(e) => setSamlCallbackUrl(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save SAML Settings"}</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider configuration</CardTitle>
          <CardDescription>Complete setup in Supabase Auth Providers. Use the callback URL shown there.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Azure AD: Authentication → Providers → Azure. Paste Application (client) ID and Secret Value. Add your site and callback URLs.</p>
          <p>SAML: Authentication → SSO/SAML. Create a SAML app and map attributes. Provide the email domain above for discovery.</p>
        </CardContent>
      </Card>
    </div>
  );
}
