import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Session = Tables<'sessions'>;
type Employee = Tables<'employees'>;

interface SessionDialogProps {
  session?: Session;
  planId?: string;
  trigger: React.ReactNode;
}

export function SessionDialog({ session, planId, trigger }: SessionDialogProps) {
  const { createSession, updateSession } = useSessions();
  const { courses } = useCourses();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [formData, setFormData] = useState({
    course_id: session?.course_id || '',
    title: session?.title || '',
    start_date: session?.start_date ? new Date(session.start_date).toISOString().slice(0, 16) : '',
    end_date: session?.end_date ? new Date(session.end_date).toISOString().slice(0, 16) : '',
    instructor_id: session?.instructor_id || '',
    location: session?.location || '',
    max_seats: session?.max_seats || 20,
  });

  // Fetch employees for instructor selection
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (data && !error) {
        setEmployees(data);
      }
    };
    
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  // Auto-generate title when course is selected
  useEffect(() => {
    if (formData.course_id && !session) {
      const selectedCourse = courses.find(c => c.id === formData.course_id);
      if (selectedCourse) {
        setFormData(prev => ({
          ...prev,
          title: selectedCourse.title
        }));
      }
    }
  }, [formData.course_id, courses, session]);

  // Auto-set end date based on course duration when start date changes
  useEffect(() => {
    if (formData.start_date && formData.course_id) {
      const selectedCourse = courses.find(c => c.id === formData.course_id);
      if (selectedCourse && selectedCourse.duration_hours) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(startDate.getTime() + (selectedCourse.duration_hours * 60 * 60 * 1000));
        setFormData(prev => ({
          ...prev,
          end_date: endDate.toISOString().slice(0, 16)
        }));
      }
    }
  }, [formData.start_date, formData.course_id, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sessionData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        plan_id: planId || null,
      };

      if (session) {
        await updateSession(session.id, sessionData);
      } else {
        await createSession(sessionData);
      }
      
      setOpen(false);
      
      // Reset form if creating new session
      if (!session) {
        setFormData({
          course_id: '',
          title: '',
          start_date: '',
          end_date: '',
          instructor_id: '',
          location: '',
          max_seats: 20,
        });
      }
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {session ? 'Edit Training Session' : 'Schedule Training Session'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="course_id">Select Course</Label>
            <Select
              value={formData.course_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-accent px-1 rounded">
                        {course.code}
                      </span>
                      <span>{course.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter session title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Date & Time
              </Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Date & Time
              </Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instructor_id">Instructor (Optional)</Label>
              <Select
                value={formData.instructor_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, instructor_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No instructor assigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="max_seats">Maximum Seats</Label>
              <Input
                id="max_seats"
                type="number"
                min="1"
                value={formData.max_seats}
                onChange={(e) => setFormData(prev => ({ ...prev, max_seats: parseInt(e.target.value) || 20 }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Conference Room A, Online, etc."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary hover:bg-primary-hover">
              {loading ? 'Saving...' : (session ? 'Update Session' : 'Schedule Session')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}