import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Users, UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type SessionWithCourse = Tables<'sessions'> & {
  courses?: Partial<Tables<'courses'>>;
};

type Employee = Tables<'employees'>;
type SessionEnrollment = Tables<'session_enrollments'> & {
  employee?: Employee;
};

interface SessionEnrollmentDialogProps {
  session: SessionWithCourse;
  onUpdate: () => void;
  trigger: React.ReactNode;
}

export function SessionEnrollmentDialog({ session, onUpdate, trigger }: SessionEnrollmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [enrollments, setEnrollments] = useState<SessionEnrollment[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, session.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (employeesError) throw employeesError;

      // Fetch current enrollments for this session
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('session_enrollments')
        .select(`
          *,
          employee:employees(*)
        `)
        .eq('session_id', session.id);

      if (enrollmentsError) throw enrollmentsError;

      setEmployees(employeesData || []);
      setEnrollments(enrollmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch enrollment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enrolledEmployeeIds = enrollments.map(e => e.employee_id);
  const availableEmployees = employees.filter(emp => !enrolledEmployeeIds.includes(emp.id));
  
  const filteredAvailableEmployees = availableEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnrollEmployees = async () => {
    if (selectedEmployees.length === 0) return;

    try {
      setLoading(true);
      
      const enrollmentData = selectedEmployees.map(employeeId => ({
        session_id: session.id,
        employee_id: employeeId,
        status: 'scheduled' as const
      }));

      const { error } = await supabase
        .from('session_enrollments')
        .insert(enrollmentData);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Enrolled ${selectedEmployees.length} employee(s) in the session`,
      });

      setSelectedEmployees([]);
      fetchData();
      onUpdate();
    } catch (error: any) {
      console.error('Error enrolling employees:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to enroll employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnenrollEmployee = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('session_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee unenrolled from session",
      });

      fetchData();
      onUpdate();
    } catch (error: any) {
      console.error('Error unenrolling employee:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unenroll employee",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredAvailableEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredAvailableEmployees.map(emp => emp.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-white">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning text-white">In Progress</Badge>;
      case 'not_completed':
        return <Badge variant="destructive">Not Completed</Badge>;
      case 'absent':
        return <Badge variant="outline">Absent</Badge>;
      default:
        return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Manage Session Enrollments
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {session.title} • {new Date(session.start_date).toLocaleDateString()}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Enrollments ({enrollments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {enrollments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No employees enrolled yet
                  </div>
                ) : (
                  enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{enrollment.employee?.name}</div>
                        <div className="text-sm text-muted-foreground">{enrollment.employee?.email}</div>
                        <div className="mt-1">{getStatusBadge(enrollment.status || 'scheduled')}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnenrollEmployee(enrollment.id)}
                        disabled={loading}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Employees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Employees</CardTitle>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedEmployees.length === filteredAvailableEmployees.length && filteredAvailableEmployees.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                      Select All ({filteredAvailableEmployees.length})
                    </label>
                  </div>
                  <Button
                    onClick={handleEnrollEmployees}
                    disabled={selectedEmployees.length === 0 || loading}
                    size="sm"
                    className="bg-gradient-primary hover:bg-primary-hover"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enroll ({selectedEmployees.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="text-center text-muted-foreground py-4">Loading...</div>
                ) : filteredAvailableEmployees.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    {searchTerm ? 'No employees match your search' : 'All employees are already enrolled'}
                  </div>
                ) : (
                  filteredAvailableEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-3 p-2 hover:bg-accent/50 rounded">
                      <Checkbox
                        id={employee.id}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEmployees([...selectedEmployees, employee.id]);
                          } else {
                            setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                          }
                        }}
                      />
                      <label htmlFor={employee.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}