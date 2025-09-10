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

interface SapienceEmployeeResponse {
  Data: SapienceEmployee[];
  TotalRecords: number;
  Success: boolean;
  Message?: string;
}

async function fetchSapienceEmployees(token: string): Promise<SapienceEmployee[]> {
  // Using the mock endpoint as specified by the user
  const employeesUrl = 'https://stoplight.io/mocks/cartelit/sapience-hcm/12673758/api/EmployeeManagement/Employee/GetEmployeeFullDetails/';
  console.log('Fetching employees from mock endpoint:', employeesUrl);
  console.log('Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

  try {
    const requestHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    console.log('Request headers:', Object.keys(requestHeaders));
    
    const response = await fetch(employeesUrl, {
      method: 'GET',
      headers: requestHeaders,
    });

    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response text:', responseText);

    if (!response.ok) {
      console.error('API response error - Status:', response.status);
      console.error('API response error - StatusText:', response.statusText);
      console.error('API response error - Body:', responseText);
      throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}. Response: ${responseText}`);
    }

    let responseData: SapienceEmployeeResponse;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
    
    console.log('Parsed API response:', responseData);
    
    if (!responseData.Success) {
      throw new Error(`API returned error: ${responseData.Message}`);
    }

    console.log(`Successfully fetched ${responseData.Data?.length || 0} employees`);
    return responseData.Data || [];
  } catch (error) {
    console.error('Error in fetchSapienceEmployees:', error);
    throw error;
  }
}

async function refreshTokenIfNeeded(supabase: any, orgId: string): Promise<string | null> {
  try {
    console.log('Getting organization settings and token...');
    
    // Get current organization settings including token
    const { data: settings, error: settingsError } = await supabase
      .from('organization_settings')
      .select('sapience_hcm_url, sapience_hcm_username, sapience_hcm_password, sapience_hcm_token, sapience_hcm_token_expires_at')
      .eq('organization_id', orgId)
      .single();

    if (settingsError || !settings) {
      console.error('Failed to get organization settings:', settingsError);
      throw new Error('Failed to retrieve organization settings');
    }

    const currentToken = settings.sapience_hcm_token;
    const expiryTime = settings.sapience_hcm_token_expires_at;

    // Check if we have a valid token
    if (currentToken && expiryTime) {
      const expiry = new Date(expiryTime);
      const now = new Date();
      
      // Add 5 minute buffer to avoid using tokens about to expire
      const bufferTime = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (expiry > bufferTime) {
        console.log('Using existing valid token');
        return currentToken;
      }
    }

    console.log('Token is missing or expired, attempting refresh...');
    
    // Check if we have login credentials
    if (!settings.sapience_hcm_url || !settings.sapience_hcm_username || !settings.sapience_hcm_password) {
      throw new Error('Sapience HCM not configured. Please go to Organization Settings and enter your Sapience HCM URL, username, and password.');
    }

    // Refresh the token
    const loginUrl = `${settings.sapience_hcm_url}/api/account/login`;
    console.log('Attempting login to:', loginUrl);

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
      const responseText = await loginResponse.text();
      console.error('Login failed:', loginResponse.status, loginResponse.statusText, responseText);
      throw new Error(`Failed to login to Sapience HCM: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const newToken = loginData.Token;
    const expiresIn = loginData.ExpiresIn || 3600;

    // Calculate expiry time
    const newExpiryTime = new Date(Date.now() + expiresIn * 1000);

    // Update the token in database
    const { error: updateError } = await supabase
      .from('organization_settings')
      .update({
        sapience_hcm_token: newToken,
        sapience_hcm_token_expires_at: newExpiryTime.toISOString(),
      })
      .eq('organization_id', orgId);

    if (updateError) {
      console.error('Failed to update token:', updateError);
      throw new Error('Failed to save refreshed token');
    }

    console.log('Token refreshed successfully, expires at:', newExpiryTime);
    return newToken;
  } catch (error) {
    console.error('Error in refreshTokenIfNeeded:', error);
    throw error;
  }
}

function mapSapienceToSupabase(sapienceEmployee: SapienceEmployee, orgId: string) {
  return {
    name: `${sapienceEmployee.FirstName} ${sapienceEmployee.LastName}`.trim(),
    email: sapienceEmployee.Email,
    organization_id: orgId,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting import-sapience-employees function');
    
    // Create supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get and validate the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Missing authorization header');
    }

    // Authenticate the user using the provided token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      throw new Error('Authentication failed');
    }

    console.log('User authenticated:', user.id);

    // Get user's organization ID
    const { data: employee, error: empError } = await supabaseClient
      .from('employees')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (empError || !employee) {
      console.error('User not found or not associated with an organization:', empError);
      throw new Error('User not found or not associated with an organization');
    }

    const orgId = employee.organization_id;
    console.log('Processing import for organization:', orgId);

    // Get a valid token (existing or refreshed)
    const validToken = await refreshTokenIfNeeded(supabaseClient, orgId);
    if (!validToken) {
      throw new Error('Failed to obtain valid Sapience HCM token');
    }
    console.log('Valid token obtained');

    // Fetch employees from Sapience HCM mock endpoint
    const sapienceEmployees = await fetchSapienceEmployees(validToken);
    console.log(`Fetched ${sapienceEmployees.length} employees from Sapience HCM`);
    
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
        .maybeSingle();

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

    const result = {
      success: true,
      message: `Successfully imported ${imported} employees from Sapience HCM`,
      imported,
      skipped: skipped.length,
      skippedDetails: skipped
    };

    console.log('Import completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-sapience-employees function:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : String(error)
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 200, // Return 200 with error in body for better debugging
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});