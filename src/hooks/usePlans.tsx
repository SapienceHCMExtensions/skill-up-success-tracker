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
      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          department:departments(*),
          created_by_employee:employees!plans_created_by_fkey(*),
          sessions(*),
          plan_employees(
            *,
            employee:employees(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch training plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: PlanInsert & { employee_ids?: string[] }) => {
    try {
      // Debug: Check current user and role
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Creating plan - Current user:', user?.email);
      
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        console.log('Creating plan - User role:', roleData?.role);
        
        const { data: employeeData } = await supabase
          .from('employees')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        console.log('Creating plan - Employee data:', employeeData);
      }

      const { employee_ids, ...planInsertData } = planData;
      
      // Add created_by if we have employee profile
      const insertData = {
        ...planInsertData,
        created_by: employeeProfile?.id || null,
      };

      console.log('Creating plan - Insert data:', insertData);

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
            employee:employees(*)
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
            employee:employees(*)
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
            employee:employees(*)
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