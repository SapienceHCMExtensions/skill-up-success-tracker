import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePlans } from '@/hooks/usePlans';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Employee = Tables<'employees'>;
type Plan = Tables<'plans'> & {
  plan_employees?: (Tables<'plan_employees'> & {
    employee?: Tables<'employees'>;
  })[];
};

interface AssignEmployeesDialogProps {
  plan: Plan;
  trigger: React.ReactNode;
  onEmployeesAssigned?: () => void;
}

export function AssignEmployeesDialog({ plan, trigger, onEmployeesAssigned }: AssignEmployeesDialogProps) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { addEmployeesToPlan } = usePlans();
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;

      // Filter out employees already assigned to this plan
      const assignedEmployeeIds = plan.plan_employees?.map(pe => pe.employee?.id) || [];
      const availableEmployees = (data || []).filter(emp => !assignedEmployeeIds.includes(emp.id));
      
      setEmployees(availableEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const handleAssignEmployees = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one employee to assign",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await addEmployeesToPlan(plan.id, selectedEmployees);
      setOpen(false);
      setSelectedEmployees([]);
      onEmployeesAssigned?.();
      toast({
        title: "Success",
        description: `${selectedEmployees.length} employee(s) assigned to the training plan`,
      });
    } catch (error) {
      console.error('Error assigning employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open, plan.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign Employees to {plan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search employees by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Employee List */}
          <ScrollArea className="h-80 border rounded-lg p-4">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p>No employees available to assign</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
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
                    <Label htmlFor={employee.id} className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Selected Count */}
          {selectedEmployees.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedEmployees.length} employee(s) selected
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignEmployees}
              disabled={selectedEmployees.length === 0 || loading}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              {loading ? 'Assigning...' : `Assign ${selectedEmployees.length || ''} Employee${selectedEmployees.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}