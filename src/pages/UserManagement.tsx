import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CsvImport } from '@/components/users/CsvImport';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, UserPlus, Settings } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Employee = Tables<'employees'> & {
  department?: Tables<'departments'> | null;
  user_roles?: Tables<'user_roles'>[] | null;
};

export default function UserManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user roles separately to avoid complex joins
      const employeesWithRoles = await Promise.all(
        (data || []).map(async (employee) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', employee.auth_user_id || '');

          return {
            ...employee,
            user_roles: roles || []
          };
        })
      );

      setEmployees(employeesWithRoles as Employee[]);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.department?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImportComplete = () => {
    fetchEmployees(); // Refresh the employee list after import
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, employees, and import data from CSV files
          </p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users & Employees
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            CSV Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Users & Employees
                <Badge variant="secondary">{employees.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{employee.name}</h3>
                          {employee.user_roles?.map((role) => (
                            <Badge key={role.id} variant="outline">
                              {role.role}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                        {employee.department && (
                          <p className="text-sm text-muted-foreground">
                            Department: {employee.department.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {new Date(employee.created_at || '').toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {filteredEmployees.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <CsvImport onImportComplete={handleImportComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}