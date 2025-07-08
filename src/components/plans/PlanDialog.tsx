import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { usePlans } from '@/hooks/usePlans';
import { PlanGeneralInfo } from './PlanGeneralInfo';
import { PlanContent } from './PlanContent';
import { PlanDelivery } from './PlanDelivery';
import { PlanSchedule } from './PlanSchedule';
import { PlanAssessment } from './PlanAssessment';
import { PlanBudget } from './PlanBudget';
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
    description: plan?.description || '',
    objectives: plan?.objectives || [],
    target_audience: plan?.target_audience || '',
    department_id: plan?.department_id || '',
    skill_gap_tags: plan?.skill_gap_tags || [],
    year: plan?.year || new Date().getFullYear(),
    quarter: plan?.quarter || null,
    estimated_cost: plan?.estimated_cost || 0,
    delivery_mode: plan?.delivery_mode || '',
    tools_required: plan?.tools_required || [],
    location_platform_info: plan?.location_platform_info || '',
    status: plan?.status || 'draft',
    modules: [],
    resources: [],
    trainers: [],
    evaluations: [],
    success_metrics: [],
    cost_breakdown: []
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

  const handleSubmit = async (e: React.FormEvent | null, saveAs: 'draft' | 'published' = 'published') => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        status: saveAs,
        objectives: formData.objectives,
        success_metrics: formData.success_metrics
      };

      if (plan) {
        await updatePlan(plan.id, submitData);
      } else {
        await createPlan(submitData);
      }
      setOpen(false);
      // Reset form if creating new plan
      if (!plan) {
        setFormData({
          name: '',
          description: '',
          objectives: [],
          target_audience: '',
          department_id: '',
          skill_gap_tags: [],
          year: new Date().getFullYear(),
          quarter: null,
          estimated_cost: 0,
          delivery_mode: '',
          tools_required: [],
          location_platform_info: '',
          status: 'draft',
          modules: [],
          resources: [],
          trainers: [],
          evaluations: [],
          success_metrics: [],
          cost_breakdown: []
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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {plan ? 'Edit Training Plan' : 'Create New Training Plan'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
            </TabsList>

            <div className="mt-6 max-h-[60vh] overflow-y-auto">
              <TabsContent value="general" className="space-y-4">
                <PlanGeneralInfo 
                  formData={formData} 
                  setFormData={setFormData} 
                  departments={departments} 
                />
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <PlanContent formData={formData} setFormData={setFormData} />
              </TabsContent>

              <TabsContent value="delivery" className="space-y-4">
                <PlanDelivery formData={formData} setFormData={setFormData} />
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <PlanSchedule formData={formData} setFormData={setFormData} />
              </TabsContent>

              <TabsContent value="assessment" className="space-y-4">
                <PlanAssessment formData={formData} setFormData={setFormData} />
              </TabsContent>

              <TabsContent value="budget" className="space-y-4">
                <PlanBudget formData={formData} setFormData={setFormData} />
              </TabsContent>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleSubmit(null, 'draft')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-gradient-primary hover:bg-primary-hover"
                >
                  {loading ? 'Publishing...' : (plan ? 'Update Plan' : 'Publish Plan')}
                </Button>
              </div>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}