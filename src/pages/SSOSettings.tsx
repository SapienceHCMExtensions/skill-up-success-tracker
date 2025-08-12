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
  const [azureTenant, setAzureTenant] = useState("");
  const [enableSaml, setEnableSaml] = useState(false);
  const [samlDomain, setSamlDomain] = useState("");

  const subdomain = useMemo(() => currentSubdomain || "default", [currentSubdomain]);

  useEffect(() => {
    // Fetch existing settings for this subdomain (public, non-sensitive)
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("sso_settings")
        .select("enable_azure, azure_tenant, enable_saml, saml_domain")
        .eq("subdomain", subdomain)
        .maybeSingle();

      if (error) {
        console.error("Failed to load SSO settings", error);
        return;
      }
      if (data) {
        setEnableAzure(!!data.enable_azure);
        setAzureTenant(data.azure_tenant || "");
        setEnableSaml(!!data.enable_saml);
        setSamlDomain(data.saml_domain || "");
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
      azure_tenant: azureTenant || null,
      enable_saml: enableSaml,
      saml_domain: samlDomain || null,
    };

    const { error } = await supabase
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
            <CardDescription>Toggle availability on the login page and optionally scope to a tenant. Client ID/Secret must be set in Supabase.</CardDescription>
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
              <Label htmlFor="azureTenant">Azure Tenant Domain/ID (optional)</Label>
              <Input id="azureTenant" placeholder="contoso.onmicrosoft.com or Tenant ID" value={azureTenant} onChange={(e) => setAzureTenant(e.target.value)} />
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
