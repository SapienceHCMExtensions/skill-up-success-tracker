import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Sparkles } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;

interface CourseDialogProps {
  course?: Course;
  trigger: React.ReactNode;
}

export function CourseDialog({ course, trigger }: CourseDialogProps) {
  const { createCourse, updateCourse } = useCourses();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { employeeProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    code: course?.code || '',
    title: course?.title || '',
    description: course?.description || '',
    provider_type: course?.provider_type || 'internal',
    duration_hours: course?.duration_hours || 0,
    default_cost: course?.default_cost || 0,
    certificate_validity_months: course?.certificate_validity_months || 0,
    competencies: course?.competencies || [],
  });

  const [newCompetency, setNewCompetency] = useState('');
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const addCompetency = () => {
    if (newCompetency.trim() && !formData.competencies.includes(newCompetency.trim())) {
      setFormData(prev => ({
        ...prev,
        competencies: [...prev.competencies, newCompetency.trim()]
      }));
      setNewCompetency('');
    }
  };

  const removeCompetency = (competency: string) => {
    setFormData(prev => ({
      ...prev,
      competencies: prev.competencies.filter(c => c !== competency)
    }));
  };

  const generateDescription = async () => {
    if (!formData.title.trim() || !formData.code.trim() || !formData.provider_type) {
      toast.error('Please fill in Course Title, Course Code, and Provider Type first');
      return;
    }

    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-course-description', {
        body: {
          title: formData.title,
          code: formData.code,
          providerType: formData.provider_type
        }
      });

      if (error) throw error;

      setFormData(prev => ({ ...prev, description: data.description }));
      toast.success('Course description generated successfully!');
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description. Please try again.');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (course) {
        await updateCourse(course.id, formData);
      } else {
        if (!employeeProfile?.organization_id) {
          toast.error('Organization context missing. Please re-login.');
          setLoading(false);
          return;
        }
        // Ensure user has permissions: admin or manager
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, organization_id')
          .eq('user_id', user.id)
          .eq('organization_id', employeeProfile.organization_id)
          .maybeSingle();
        if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'manager')) {
          toast.error('You need admin or manager role to create courses.');
          setLoading(false);
          return;
        }
        await createCourse({ ...formData, organization_id: employeeProfile.organization_id });
      }
      setOpen(false);
      // Reset form if creating new course
      if (!course) {
        setFormData({
          code: '',
          title: '',
          description: '',
          provider_type: 'internal',
          duration_hours: 0,
          default_cost: 0,
          certificate_validity_months: 0,
          competencies: [],
        });
      }
    } catch (error) {
      console.error('Error saving course:', error);
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
          <DialogTitle>
            {course ? 'Edit Course' : 'Add New Course'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., SF-101"
                required
              />
            </div>
            <div>
              <Label htmlFor="provider_type">Provider Type</Label>
              <Select
                value={formData.provider_type}
                onValueChange={(value: 'internal' | 'external') => 
                  setFormData(prev => ({ ...prev, provider_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter course title"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="description">Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateDescription}
                disabled={generatingDescription || !formData.title.trim() || !formData.code.trim() || !formData.provider_type}
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {generatingDescription ? 'Generating...' : 'Generate AI Description'}
              </Button>
            </div>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter course description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="duration_hours">Duration (Hours)</Label>
              <Input
                id="duration_hours"
                type="number"
                min="0"
                value={formData.duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="default_cost">Default Cost ($)</Label>
              <Input
                id="default_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.default_cost || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, default_cost: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="certificate_validity_months">Certificate Validity (Months)</Label>
              <Input
                id="certificate_validity_months"
                type="number"
                min="0"
                value={formData.certificate_validity_months || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, certificate_validity_months: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div>
            <Label>Competencies</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newCompetency}
                  onChange={(e) => setNewCompetency(e.target.value)}
                  placeholder="Add competency"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetency())}
                />
                <Button type="button" onClick={addCompetency} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.competencies.map((competency, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {competency}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 ml-1"
                      onClick={() => removeCompetency(competency)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary hover:bg-primary-hover">
              {loading ? 'Saving...' : (course ? 'Update Course' : 'Create Course')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}