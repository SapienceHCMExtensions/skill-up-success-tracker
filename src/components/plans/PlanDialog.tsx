import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { usePlans } from '@/hooks/usePlans';
import type { Tables } from '@/integrations/supabase/types';

type Plan = Tables<'plans'>;
type Department = Tables<'departments'>;

interface PlanDialogProps {
  plan?: Plan;
  trigger: React.ReactNode;
}

export function PlanDialog({ plan, trigger }: PlanDialogProps) {
  const { createPlan, updatePlan } = usePlans();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    department_id: plan?.department_id || '',
    year: plan?.year || new Date().getFullYear(),
    quarter: plan?.quarter || null,
    estimated_cost: plan?.estimated_cost || 0,
  });

  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) {
        console.error('Department fetch error:', error);
        throw error;
      }
      console.log('Departments fetched:', data);
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (plan) {
        await updatePlan(plan.id, formData);
      } else {
        await createPlan(formData);
      }
      setOpen(false);
      // Reset form if creating new plan
      if (!plan) {
        setFormData({
          name: '',
          department_id: '',
          year: new Date().getFullYear(),
          quarter: null,
          estimated_cost: 0,
        });
      }
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  console.log('PlanDialog render - open:', open, 'departments:', departments.length);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {plan ? 'Edit Training Plan' : 'Create New Training Plan'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter training plan name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department_id">Department</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
              <Input
                id="estimated_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_cost || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                max="2030"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="quarter">Quarter (Optional)</Label>
              <Select
                value={formData.quarter?.toString() || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, quarter: value ? parseInt(value) : null }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific quarter</SelectItem>
                  <SelectItem value="1">Q1</SelectItem>
                  <SelectItem value="2">Q2</SelectItem>
                  <SelectItem value="3">Q3</SelectItem>
                  <SelectItem value="4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary hover:bg-primary-hover">
              {loading ? 'Saving...' : (plan ? 'Update Plan' : 'Create Plan')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}