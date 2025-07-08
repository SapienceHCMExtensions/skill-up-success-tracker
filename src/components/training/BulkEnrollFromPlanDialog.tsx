import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkEnrollFromPlanDialogProps {
  planEmployees: any[];
  sessionId: string;
  onUpdate: () => void;
  trigger: React.ReactNode;
}

export function BulkEnrollFromPlanDialog({ planEmployees, sessionId, onUpdate, trigger }: BulkEnrollFromPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEnrollAll = async () => {
    if (selectedEmployees.length === 0) return;

    try {
      setLoading(true);
      
      const enrollmentData = selectedEmployees.map(employeeId => ({
        session_id: sessionId,
        employee_id: employeeId,
        status: 'scheduled' as const
      }));

      const { error } = await supabase
        .from('session_enrollments')
        .insert(enrollmentData);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Enrolled ${selectedEmployees.length} employees from the training plan`,
      });

      setOpen(false);
      setSelectedEmployees([]);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Enroll Plan Employees
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Select employees from the training plan to enroll in this session:
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {planEmployees.map((planEmployee) => (
              <div key={planEmployee.employee?.id} className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedEmployees.includes(planEmployee.employee?.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedEmployees([...selectedEmployees, planEmployee.employee?.id]);
                    } else {
                      setSelectedEmployees(selectedEmployees.filter(id => id !== planEmployee.employee?.id));
                    }
                  }}
                />
                <div className="flex-1">
                  <div className="font-medium">{planEmployee.employee?.name}</div>
                  <div className="text-xs text-muted-foreground">{planEmployee.employee?.email}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEnrollAll}
              disabled={selectedEmployees.length === 0 || loading}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Enroll ({selectedEmployees.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}