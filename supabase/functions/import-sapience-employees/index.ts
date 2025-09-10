import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SapienceEmployee {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  DepartmentName?: string;
  EmployeeCode?: string;
  JobTitle?: string;
  PhoneNumber?: string;
  HireDate?: string;
  Status?: string;
}

interface SapienceLoginResponse {
  Token: string;
  ExpiresIn: number;
  TokenType: string;
}

interface SapienceEmployeeResponse {
  Data: SapienceEmployee[];
  TotalRecords: number;
  Success: boolean;
  Message?: string;
}

async function refreshSapienceToken(supabase: any, orgId: string): Promise<string | null> {
  console.log('Attempting to refresh Sapience HCM token for org:', orgId);
  
  // Get current organization settings
  const { data: settings, error: settingsError } = await supabase
    .from('organization_settings')
    .select('sapience_hcm_url, sapience_hcm_username, sapience_hcm_password')
    .eq('organization_id', orgId)
    .single();

  if (settingsError || !settings) {
    console.error('Failed to get organization settings:', settingsError);
    return null;
  }

  if (!settings.sapience_hcm_url || !settings.sapience_hcm_username || !settings.sapience_hcm_password) {
    console.error('Missing Sapience HCM configuration');
    return null;
  }

  const loginUrl = `${settings.sapience_hcm_url}/api/account/login`;
  console.log('Attempting login to:', loginUrl);

  try {
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Username: settings.sapience_hcm_username,
        Password: settings.sapience_hcm_password,
      }),
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status, loginResponse.statusText);
      return null;
    }

    const loginData: SapienceLoginResponse = await loginResponse.json();
    const newToken = loginData.Token;
    const expiresIn = loginData.ExpiresIn || 3600; // Default 1 hour

    // Calculate expiry time
    const expiryTime = new Date(Date.now() + expiresIn * 1000);

    // Update the token in organization settings
    const { error: updateError } = await supabase
      .from('organization_settings')
      .update({
        sapience_hcm_token: newToken,
        sapience_hcm_token_expires_at: expiryTime.toISOString(),
      })
      .eq('organization_id', orgId);

    if (updateError) {
      console.error('Failed to update token:', updateError);
      return null;
    }

    console.log('Token refreshed successfully, expires at:', expiryTime);
    return newToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function getValidToken(supabase: any, orgId: string): Promise<string | null> {
  // Get current token and expiry
  const { data: settings, error } = await supabase
    .from('organization_settings')
    .select('sapience_hcm_token, sapience_hcm_token_expires_at')
    .eq('organization_id', orgId)
    .single();

  if (error || !settings) {
    console.error('Failed to get organization settings:', error);
    return null;
  }

  const currentToken = settings.sapience_hcm_token;
  const expiryTime = settings.sapience_hcm_token_expires_at;

  // Check if token exists and is not expired
  if (currentToken && expiryTime) {
    const expiry = new Date(expiryTime);
    const now = new Date();
    
    // Add 5 minute buffer to avoid using tokens that are about to expire
    const bufferTime = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (expiry > bufferTime) {
      console.log('Using existing valid token');
      return currentToken;
    }
  }

  console.log('Token is missing or expired, refreshing...');
  return await refreshSapienceToken(supabase, orgId);
}

async function fetchSapienceEmployees(baseUrl: string, token: string): Promise<SapienceEmployee[]> {
  const employeesUrl = `${baseUrl}/api/EmployeeManagement/Employee/GetEmployeeFullDetails`;
  console.log('Fetching employees from:', employeesUrl);

  try {
    const response = await fetch(employeesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
    }

    const responseData: SapienceEmployeeResponse = await response.json();
    
    if (!responseData.Success) {
      throw new Error(`API returned error: ${responseData.Message}`);
    }

    console.log(`Successfully fetched ${responseData.Data?.length || 0} employees`);
    return responseData.Data || [];
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
}

function mapSapienceToSupabase(sapienceEmployee: SapienceEmployee, orgId: string) {
  return {
    name: `${sapienceEmployee.FirstName} ${sapienceEmployee.LastName}`.trim(),
    email: sapienceEmployee.Email,
    organization_id: orgId,
    // Map additional fields if they exist in your employees table
    // You might need to handle department mapping separately
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Set the auth context for RLS
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Get user's organization
    const { data: employee, error: empError } = await supabaseClient
      .from('employees')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (empError || !employee) {
      throw new Error('User not found or not associated with an organization');
    }

    const orgId = employee.organization_id;
    console.log('Processing import for organization:', orgId);

    // Get organization settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('organization_settings')
      .select('sapience_hcm_url')
      .eq('organization_id', orgId)
      .single();

    if (settingsError || !settings?.sapience_hcm_url) {
      throw new Error('Sapience HCM not configured for this organization');
    }

    // Get valid token
    const validToken = await getValidToken(supabaseClient, orgId);
    if (!validToken) {
      throw new Error('Failed to obtain valid Sapience HCM token');
    }

    // Fetch employees from Sapience HCM
    const sapienceEmployees = await fetchSapienceEmployees(settings.sapience_hcm_url, validToken);
    
    if (sapienceEmployees.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No employees found in Sapience HCM',
        imported: 0,
        skipped: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process and validate employees
    const employeesToImport = [];
    const skipped = [];

    for (const sapienceEmp of sapienceEmployees) {
      // Validate required fields
      if (!sapienceEmp.Email || !sapienceEmp.FirstName) {
        skipped.push({
          id: sapienceEmp.Id,
          reason: 'Missing required fields (email or name)'
        });
        continue;
      }

      // Check if employee already exists
      const { data: existing } = await supabaseClient
        .from('employees')
        .select('id')
        .eq('email', sapienceEmp.Email)
        .eq('organization_id', orgId)
        .single();

      if (existing) {
        skipped.push({
          id: sapienceEmp.Id,
          email: sapienceEmp.Email,
          reason: 'Employee already exists'
        });
        continue;
      }

      employeesToImport.push(mapSapienceToSupabase(sapienceEmp, orgId));
    }

    console.log(`Importing ${employeesToImport.length} employees, skipping ${skipped.length}`);

    let imported = 0;
    if (employeesToImport.length > 0) {
      const { data: insertedEmployees, error: insertError } = await supabaseClient
        .from('employees')
        .insert(employeesToImport)
        .select('id');

      if (insertError) {
        console.error('Error inserting employees:', insertError);
        throw new Error(`Failed to import employees: ${insertError.message}`);
      }

      imported = insertedEmployees?.length || 0;
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully imported ${imported} employees from Sapience HCM`,
      imported,
      skipped: skipped.length,
      skippedDetails: skipped
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-sapience-employees function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});