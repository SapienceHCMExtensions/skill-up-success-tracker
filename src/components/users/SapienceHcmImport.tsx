import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Database, Users, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  skippedDetails?: Array<{
    id: string;
    email?: string;
    reason: string;
  }>;
  error?: string;
}

interface SapienceHcmImportProps {
  onImportComplete: () => void;
}

export function SapienceHcmImport({ onImportComplete }: SapienceHcmImportProps) {
  const [importing, setImporting] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setLastResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('import-sapience-employees', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Edge function response:', response);

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(response.error.message || JSON.stringify(response.error) || 'Import failed');
      }

      if (!response.data) {
        throw new Error('No data returned from edge function');
      }

      const result: ImportResult = response.data;
      setLastResult(result);

      if (result.success) {
        toast.success(result.message);
        onImportComplete();
      } else {
        toast.error(result.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorResult: ImportResult = {
        success: false,
        message: '',
        imported: 0,
        skipped: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      setLastResult(errorResult);
      toast.error(errorResult.error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Import from Sapience HCM
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Import employee data from your connected Sapience HCM system. This will fetch all employees
          and add them to your organization if they don't already exist.
        </p>
        
        <Alert className="border-blue-500">
          <AlertCircle className="w-4 h-4 text-blue-500" />
          <AlertDescription>
            <strong>Prerequisites:</strong> Make sure you have configured your Sapience HCM connection in Organization Settings first, including the URL, username, and password.
          </AlertDescription>
        </Alert>

        {lastResult && (
          <Alert className={lastResult.success ? 'border-green-500' : 'border-red-500'}>
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <AlertDescription>
                {lastResult.success ? (
                  <div>
                    <p className="font-medium">{lastResult.message}</p>
                    <div className="mt-2 text-sm">
                      <p>• Imported: {lastResult.imported} employees</p>
                      <p>• Skipped: {lastResult.skipped} employees</p>
                      {lastResult.skippedDetails && lastResult.skippedDetails.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-medium">View skipped employees</summary>
                          <ul className="mt-1 ml-4 list-disc">
                            {lastResult.skippedDetails.map((item, index) => (
                              <li key={index} className="text-xs">
                                {item.email || item.id}: {item.reason}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                ) : (
                  <p>{lastResult.error}</p>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={importing} className="w-full">
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Import Sapience HCM Employee Data
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Import Employee Data from Sapience HCM?</AlertDialogTitle>
              <AlertDialogDescription>
                This will fetch all employee data from your connected Sapience HCM system and add them to your organization.
                <br /><br />
                <strong>Important:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Existing employees with the same email will be skipped</li>
                  <li>New employees will be added to your organization</li>
                  <li>This operation cannot be undone easily</li>
                </ul>
                <br />
                Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleImport}>
                Yes, Import Employees
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}