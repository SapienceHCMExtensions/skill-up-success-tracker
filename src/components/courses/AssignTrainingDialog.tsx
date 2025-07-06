import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;
type Employee = Tables<'employees'>;
type Session = Tables<'sessions'>;

interface AssignTrainingDialogProps {
  course: Course;
  trigger: React.ReactNode;
}

export function AssignTrainingDialog({ course, trigger }: AssignTrainingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('course_id', course.id)
        .gte('start_date', new Date().toISOString())
        .order('start_date');

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const assignTraining = async () => {
    if (selectedEmployees.length === 0 || !selectedSession) {
      toast({
        title: "Validation Error",
        description: "Please select employees and a session",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const enrollments = selectedEmployees.map(employeeId => ({
        employee_id: employeeId,
        session_id: selectedSession,
        status: 'scheduled' as const,
      }));

      const { error } = await supabase
        .from('session_enrollments')
        .insert(enrollments);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Training assigned to ${selectedEmployees.length} employee(s)`,
      });

      setOpen(false);
      setSelectedEmployees([]);
      setSelectedSession('');
    } catch (error: any) {
      console.error('Error assigning training:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign training",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchSessions();
    }
  }, [open, course.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Training - {course.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Session Selection */}
          <div>
            <Label>Select Training Session</Label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{session.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {new Date(session.start_date).toLocaleDateString()}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sessions.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No upcoming sessions available for this course.
              </p>
            )}
          </div>

          {/* Employee Selection */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Label>Select Employees</Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedEmployees.length} employee(s) selected
              </span>
            </div>

            <div className="border rounded-md overflow-y-auto flex-1 max-h-60">
              {filteredEmployees.map(employee => (
                <div
                  key={employee.id}
                  className="flex items-center space-x-3 p-3 border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleEmployee(employee.id)}
                >
                  <Checkbox
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={() => toggleEmployee(employee.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={assignTraining}
            disabled={loading || selectedEmployees.length === 0 || !selectedSession}
            className="bg-gradient-primary hover:bg-primary-hover"
          >
            {loading ? 'Assigning...' : `Assign to ${selectedEmployees.length} Employee(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}