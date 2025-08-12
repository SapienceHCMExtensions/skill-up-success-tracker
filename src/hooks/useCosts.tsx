import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type CostActual = Tables<'cost_actuals'> & {
  session?: Tables<'sessions'> & {
    course?: Tables<'courses'>;
    plan?: Tables<'plans'>;
  };
};

type Plan = Tables<'plans'> & {
  department?: Tables<'departments'>;
  sessions?: Tables<'sessions'>[];
};

interface CostSummary {
  totalEstimated: number;
  totalActual: number;
  variance: number;
  variancePercentage: number;
  monthlyData: Array<{
    month: string;
    estimated: number;
    actual: number;
    variance: number;
  }>;
  departmentBreakdown: Array<{
    department: string;
    estimated: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  }>;
  planBreakdown: Array<{
    planName: string;
    estimated: number;
    actual: number;
    variance: number;
    status: 'under' | 'over' | 'on-track';
  }>;
}

export function useCosts() {
  const [costActuals, setCostActuals] = useState<CostActual[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { employeeProfile } = useAuth();

  const fetchCostActuals = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_actuals')
        .select(`
          *,
          session:sessions(
            *,
            course:courses(*),
            plan:plans(*)
          )
        `)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setCostActuals(data || []);
    } catch (error) {
      console.error('Error fetching cost actuals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cost actuals",
        variant: "destructive",
      });
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          department:departments(*),
          sessions:sessions(*)
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
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCostActuals(), fetchPlans()]);
    setLoading(false);
  };

  const createCostActual = async (costData: {
    sessionId: string;
    amount: number;
    description?: string;
    invoiceNo?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('cost_actuals')
        .insert({
          session_id: costData.sessionId,
          amount: costData.amount,
          description: costData.description,
          invoice_no: costData.invoiceNo,
          organization_id: employeeProfile?.organization_id as string,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cost record created successfully",
      });

      await fetchCostActuals();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating cost actual:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create cost record",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const getCostSummary = (): CostSummary => {
    // Calculate totals
    const totalEstimated = plans.reduce((sum, plan) => sum + (plan.estimated_cost || 0), 0);
    const totalActual = costActuals.reduce((sum, cost) => sum + cost.amount, 0);
    const variance = totalActual - totalEstimated;
    const variancePercentage = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;

    // Monthly data
    const monthlyData: { [key: string]: { estimated: number; actual: number } } = {};
    
    // Process plans for estimated costs by month
    plans.forEach(plan => {
      if (plan.created_at) {
        const month = new Date(plan.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!monthlyData[month]) {
          monthlyData[month] = { estimated: 0, actual: 0 };
        }
        monthlyData[month].estimated += plan.estimated_cost || 0;
      }
    });

    // Process cost actuals by month
    costActuals.forEach(cost => {
      if (cost.recorded_at) {
        const month = new Date(cost.recorded_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!monthlyData[month]) {
          monthlyData[month] = { estimated: 0, actual: 0 };
        }
        monthlyData[month].actual += cost.amount;
      }
    });

    const monthlyDataArray = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      estimated: data.estimated,
      actual: data.actual,
      variance: data.actual - data.estimated,
    }));

    // Department breakdown
    const departmentData: { [key: string]: { estimated: number; actual: number } } = {};
    
    plans.forEach(plan => {
      const deptName = plan.department?.name || 'Unassigned';
      if (!departmentData[deptName]) {
        departmentData[deptName] = { estimated: 0, actual: 0 };
      }
      departmentData[deptName].estimated += plan.estimated_cost || 0;
    });

    costActuals.forEach(cost => {
      // Find the plan for this cost to get department info
      const planForCost = plans.find(plan => plan.id === cost.session?.plan_id);
      const deptName = planForCost?.department?.name || 'Unassigned';
      if (!departmentData[deptName]) {
        departmentData[deptName] = { estimated: 0, actual: 0 };
      }
      departmentData[deptName].actual += cost.amount;
    });

    const departmentBreakdown = Object.entries(departmentData).map(([department, data]) => {
      const variance = data.actual - data.estimated;
      const variancePercentage = data.estimated > 0 ? (variance / data.estimated) * 100 : 0;
      return {
        department,
        estimated: data.estimated,
        actual: data.actual,
        variance,
        variancePercentage,
      };
    });

    // Plan breakdown
    const planBreakdown = plans.map(plan => {
      const planActualCosts = costActuals
        .filter(cost => cost.session?.plan_id === plan.id)
        .reduce((sum, cost) => sum + cost.amount, 0);
      
      const variance = planActualCosts - (plan.estimated_cost || 0);
      const variancePercentage = plan.estimated_cost ? (variance / plan.estimated_cost) * 100 : 0;
      
      let status: 'under' | 'over' | 'on-track' = 'on-track';
      if (variancePercentage > 10) status = 'over';
      else if (variancePercentage < -10) status = 'under';

      return {
        planName: plan.name,
        estimated: plan.estimated_cost || 0,
        actual: planActualCosts,
        variance,
        status,
      };
    });

    return {
      totalEstimated,
      totalActual,
      variance,
      variancePercentage,
      monthlyData: monthlyDataArray,
      departmentBreakdown,
      planBreakdown,
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    costActuals,
    plans,
    loading,
    createCostActual,
    getCostSummary,
    refetch: fetchData,
  };
}