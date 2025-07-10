import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCourses } from '@/hooks/useCourses';
import { useTrainingRequests } from '@/hooks/useTrainingRequests';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TrainingRequestDialogProps {
  trigger: React.ReactNode;
  employeeId?: string;
}

export function TrainingRequestDialog({ trigger, employeeId }: TrainingRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeId || '');
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [justification, setJustification] = useState('');
  const [trainingProvider, setTrainingProvider] = useState('');
  const [trainingDate, setTrainingDate] = useState<Date | undefined>();
  const [estimatedCost, setEstimatedCost] = useState('');
  const [courseId, setCourseId] = useState<string>('none');

  const { courses } = useCourses();
  const { createRequest } = useTrainingRequests();

  // Fetch employees when dialog opens
  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, name, email')
      .order('name');
    setEmployees(data || []);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchEmployees();
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setJustification('');
      setTrainingProvider('');
      setTrainingDate(undefined);
      setEstimatedCost('');
      setCourseId('none');
      setSelectedEmployeeId(employeeId || '');
    }
  };

  const handleSubmit = async () => {
    if (!title || !justification || !selectedEmployeeId) return;

    setLoading(true);
    try {
      await createRequest({
        employee_id: selectedEmployeeId,
        title,
        description,
        training_provider: trainingProvider || undefined,
        training_date: trainingDate ? format(trainingDate, 'yyyy-MM-dd') : undefined,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        justification,
        course_id: courseId !== 'none' ? courseId : undefined,
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Training Request</DialogTitle>
          <DialogDescription>
            Submit a new training request for approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee Selection (only show if no employeeId provided) */}
          {!employeeId && (
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Training Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Training Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Advanced Project Management"
            />
          </div>

          {/* Existing Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">Link to Existing Course (Optional)</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select existing course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No existing course</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Training Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Training Provider</Label>
            <Input
              id="provider"
              value={trainingProvider}
              onChange={(e) => setTrainingProvider(e.target.value)}
              placeholder="e.g., Training Company Name"
            />
          </div>

          {/* Training Date */}
          <div className="space-y-2">
            <Label>Proposed Training Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !trainingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {trainingDate ? format(trainingDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={trainingDate}
                  onSelect={setTrainingDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Estimated Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost">Estimated Cost</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the training content..."
              rows={3}
            />
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <Label htmlFor="justification">Business Justification *</Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why this training is needed and how it will benefit the organization..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !title || !justification || !selectedEmployeeId}
            type="button"
          >
            {loading ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
