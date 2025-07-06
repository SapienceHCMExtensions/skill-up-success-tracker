import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Users } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CsvRow {
  name: string;
  email: string;
  department?: string;
  role?: string;
  [key: string]: any;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string; data: CsvRow }>;
}

export function CsvImport() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCsv(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCsv = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CsvRow[];
        setCsvData(data);
        console.log('Parsed CSV data:', data);
      },
      error: (error) => {
        toast({
          title: "Parse error",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const validateRow = (row: CsvRow, index: number): string | null => {
    if (!row.name || row.name.trim() === '') {
      return `Row ${index + 1}: Name is required`;
    }
    if (!row.email || row.email.trim() === '') {
      return `Row ${index + 1}: Email is required`;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      return `Row ${index + 1}: Invalid email format`;
    }
    return null;
  };

  const importData = async () => {
    if (!csvData.length) return;

    setImporting(true);
    setProgress(0);

    const errors: ImportResult['errors'] = [];
    let successCount = 0;

    // First, get or create departments
    const departments = [...new Set(csvData.filter(row => row.department).map(row => row.department))];
    const departmentMap = new Map<string, string>();

    for (const deptName of departments) {
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id, name')
        .eq('name', deptName)
        .single();

      if (existingDept) {
        departmentMap.set(deptName, existingDept.id);
      } else {
        const { data: newDept, error } = await supabase
          .from('departments')
          .insert({ name: deptName })
          .select('id')
          .single();

        if (newDept && !error) {
          departmentMap.set(deptName, newDept.id);
        }
      }
    }

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const validationError = validateRow(row, i);

      if (validationError) {
        errors.push({ row: i + 1, message: validationError, data: row });
        continue;
      }

      try {
        // Check if employee already exists
        const { data: existingEmployee } = await supabase
          .from('employees')
          .select('email')
          .eq('email', row.email)
          .single();
        
        const userExists = !!existingEmployee;

        if (!userExists) {
          // Create auth user
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: row.email,
            password: 'TempPassword123!', // Temporary password
            email_confirm: true,
            user_metadata: { name: row.name }
          });

          if (authError) {
            errors.push({ row: i + 1, message: authError.message, data: row });
            continue;
          }

          if (authUser.user) {
            // Create employee record
            const { error: employeeError } = await supabase
              .from('employees')
              .insert({
                auth_user_id: authUser.user.id,
                name: row.name,
                email: row.email,
                department_id: row.department ? departmentMap.get(row.department) : null
              });

            if (employeeError) {
              errors.push({ row: i + 1, message: employeeError.message, data: row });
              continue;
            }

            // Create user role
            const role = row.role || 'employee';
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: authUser.user.id,
                role: role as any
              });

            if (roleError) {
              errors.push({ row: i + 1, message: roleError.message, data: row });
              continue;
            }
          }
        } else {
          errors.push({ row: i + 1, message: 'User with this email already exists', data: row });
          continue;
        }

        successCount++;
      } catch (error) {
        errors.push({ 
          row: i + 1, 
          message: error instanceof Error ? error.message : 'Unknown error', 
          data: row 
        });
      }

      setProgress(((i + 1) / csvData.length) * 100);
    }

    setResult({ success: successCount, errors });
    setImporting(false);

    toast({
      title: "Import completed",
      description: `Successfully imported ${successCount} users. ${errors.length} errors.`,
      variant: successCount > 0 ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            CSV Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          {file && (
            <Alert>
              <FileText className="w-4 h-4" />
              <AlertDescription>
                File loaded: {file.name} ({csvData.length} rows)
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted p-4 rounded-md">
            <h4 className="font-medium mb-2">Expected CSV Format:</h4>
            <code className="text-sm">
              name,email,department,role<br />
              John Doe,john@example.com,IT,employee<br />
              Jane Smith,jane@example.com,HR,manager
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              Required fields: name, email<br />
              Optional fields: department, role (defaults to 'employee')
            </p>
          </div>

          {csvData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {csvData.length} users to import
                </Badge>
                <Button 
                  onClick={importData} 
                  disabled={importing}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import Users
                    </>
                  )}
                </Button>
              </div>

              {importing && (
                <Progress value={progress} className="w-full" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="default" className="bg-green-500">
                {result.success} successful
              </Badge>
              <Badge variant="destructive">
                {result.errors.length} errors
              </Badge>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        Row {error.row}: {error.message}
                        <br />
                        <span className="text-xs">
                          {error.data.name} ({error.data.email})
                        </span>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}