import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Plan = Tables<'plans'> & {
  department?: Tables<'departments'>;
  created_by_employee?: Tables<'employees'>;
  sessions?: Tables<'sessions'>[];
  plan_employees?: (Tables<'plan_employees'> & {
    employee?: Tables<'employees'>;
  })[];
};

type PlanInsert = TablesInsert<'plans'>;
type PlanUpdate = TablesUpdate<'plans'>;

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { employeeProfile } = useAuth();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      
      // First, try to get the current user to ensure we're authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        setPlans([]);
        return;
      }

    const { data, error } = await supabase
      .from('plans')
      .select(`
        *,
        department:departments(*),
        created_by_employee:employees!plans_created_by_fkey(*),
        sessions(*),
        plan_employees(
          *,
          employee:employees!plan_employees_employee_id_fkey(*)
        )
      `)
      .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching plans:', error);
        throw error;
      }
      
      console.log('Successfully fetched plans:', data?.length || 0);
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch training plans. Please ensure you have the required permissions.",
        variant: "destructive",
      });
      setPlans([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: PlanInsert & { 
    employee_ids?: string[], 
    modules?: any[], 
    resources?: any[], 
    trainers?: any[],
    evaluations?: any[],
    cost_breakdown?: any[]
  }) => {
    try {
      const { 
        employee_ids, 
        modules, 
        resources, 
        trainers, 
        evaluations, 
        cost_breakdown,
        ...planInsertData 
      } = planData;
      
      // Add created_by if we have employee profile
      const insertData = {
        ...planInsertData,
        created_by: employeeProfile?.id || null,
      };

      const { data, error } = await supabase
        .from('plans')
        .insert(insertData)
        .select(`
          *,
          department:departments(*),
          created_by_employee:employees!plans_created_by_fkey(*),
          sessions(*),
          plan_employees(
            *,
            employee:employees!plan_employees_employee_id_fkey(*)
          )
        `)
        .single();

      if (error) {
        console.error('Plan creation error:', error);
        throw error;
      }

      // Add employees to plan if provided
      if (employee_ids && employee_ids.length > 0) {
        const planEmployees = employee_ids.map(employeeId => ({
          plan_id: data.id,
          employee_id: employeeId,
          required: true,
        }));

        const { error: employeeError } = await supabase
          .from('plan_employees')
          .insert(planEmployees);

        if (employeeError) throw employeeError;
      }

      // Add modules if provided
      if (modules && modules.length > 0) {
        const planModules = modules.map(module => ({
          plan_id: data.id,
          name: module.name,
          content_type: module.content_type,
          duration_hours: module.duration_hours,
          learning_outcomes: module.learning_outcomes,
          start_date: module.start_date || null,
          end_date: module.end_date || null
        }));

        const { error: moduleError } = await supabase
          .from('plan_modules')
          .insert(planModules);

        if (moduleError) throw moduleError;
      }

      // Add resources if provided
      if (resources && resources.length > 0) {
        const planResources = resources.map(resource => ({
          plan_id: data.id,
          name: resource.name,
          resource_type: resource.resource_type,
          url_or_path: resource.url_or_path,
          description: resource.description
        }));

        const { error: resourceError } = await supabase
          .from('plan_resources')
          .insert(planResources);

        if (resourceError) throw resourceError;
      }

      // Add trainers if provided
      if (trainers && trainers.length > 0) {
        const planTrainers = trainers.map(trainer => ({
          plan_id: data.id,
          trainer_id: trainer.trainer_id,
          role: trainer.role || 'instructor'
        }));

        const { error: trainerError } = await supabase
          .from('plan_trainers')
          .insert(planTrainers);

        if (trainerError) throw trainerError;
      }

      // Add evaluations if provided
      if (evaluations && evaluations.length > 0) {
        const planEvaluations = evaluations.map(evaluation => ({
          plan_id: data.id,
          evaluation_type: evaluation.evaluation_type,
          title: evaluation.title,
          description: evaluation.description,
          questions: null
        }));

        const { error: evaluationError } = await supabase
          .from('plan_evaluations')
          .insert(planEvaluations);

        if (evaluationError) throw evaluationError;
      }

      // Add cost breakdown if provided
      if (cost_breakdown && cost_breakdown.length > 0) {
        const planCosts = cost_breakdown.map(cost => ({
          plan_id: data.id,
          item_name: cost.item_name,
          cost: cost.cost,
          description: cost.description
        }));

        const { error: costError } = await supabase
          .from('plan_cost_breakdown')
          .insert(planCosts);

        if (costError) throw costError;
      }

      // Fetch the updated plan with all relationships
      const { data: updatedPlan } = await supabase
        .from('plans')
        .select(`
          *,
          department:departments(*),
          created_by_employee:employees!plans_created_by_fkey(*),
          sessions(*),
          plan_employees(
            *,
            employee:employees!plan_employees_employee_id_fkey(*)
          )
        `)
        .eq('id', data.id)
        .single();

      setPlans(prev => [updatedPlan || data, ...prev]);
      toast({
        title: "Success",
        description: "Training plan created successfully",
      });
      
      return { data: updatedPlan || data, error: null };
    } catch (error: any) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create training plan",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updatePlan = async (id: string, planData: PlanUpdate) => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .update(planData)
        .eq('id', id)
        .select(`
          *,
          department:departments(*),
          created_by_employee:employees!plans_created_by_fkey(*),
          sessions(*),
          plan_employees(
            *,
            employee:employees!plan_employees_employee_id_fkey(*)
          )
        `)
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(plan => 
        plan.id === id ? data : plan
      ));
      
      toast({
        title: "Success",
        description: "Training plan updated successfully",
      });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update training plan",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlans(prev => prev.filter(plan => plan.id !== id));
      toast({
        title: "Success",
        description: "Training plan deleted successfully",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete training plan",
        variant: "destructive",
      });
      return { error };
    }
  };

  const addEmployeesToPlan = async (planId: string, employeeIds: string[]) => {
    try {
      const planEmployees = employeeIds.map(employeeId => ({
        plan_id: planId,
        employee_id: employeeId,
        required: true,
      }));

      const { error } = await supabase
        .from('plan_employees')
        .insert(planEmployees);

      if (error) throw error;

      // Refetch plans to get updated data
      await fetchPlans();
      
      toast({
        title: "Success",
        description: "Employees added to training plan",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Error adding employees to plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add employees to plan",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    addEmployeesToPlan,
    refetch: fetchPlans,
  };
}