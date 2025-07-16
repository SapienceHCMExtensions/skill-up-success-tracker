import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type CourseExpense = Tables<'course_cost_actuals'> & {
  employee?: Tables<'employees'>;
  course?: Tables<'courses'>;
  training_request?: Tables<'training_requests'>;
  recorded_by_employee?: Partial<Tables<'employees'>>;
  approved_by_employee?: Partial<Tables<'employees'>>;
};

export function useCourseExpenses() {
  const [expenses, setExpenses] = useState<CourseExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('course_cost_actuals')
        .select(`
          *,
          employee:employees!course_cost_actuals_employee_id_fkey(*),
          course:courses(*),
          training_request:training_requests(*),
          recorded_by_employee:employees!course_cost_actuals_recorded_by_fkey(name, email),
          approved_by_employee:employees!course_cost_actuals_approved_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching course expenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch course expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData: {
    course_id?: string;
    training_request_id?: string;
    amount: number;
    cost_type: string;
    description?: string;
    receipt_url?: string;
    invoice_no?: string;
    expense_date?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!employee) throw new Error('Employee record not found');

      const { data, error } = await supabase
        .from('course_cost_actuals')
        .insert({
          ...expenseData,
          employee_id: employee.id,
          recorded_by: employee.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense submitted successfully",
      });

      await fetchExpenses();
      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: "Failed to submit expense",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateExpenseStatus = async (
    expenseId: string, 
    status: string, 
    comment?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!employee) throw new Error('Employee record not found');

      const updateData: any = { status };

      if (status === 'approved' || status === 'rejected') {
        updateData.approved_by = employee.id;
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('course_cost_actuals')
        .update(updateData)
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Expense ${status} successfully`,
      });

      await fetchExpenses();
    } catch (error) {
      console.error('Error updating expense status:', error);
      toast({
        title: "Error",
        description: "Failed to update expense status",
        variant: "destructive",
      });
    }
  };

  const updateExpense = async (expenseId: string, updates: Partial<CourseExpense>) => {
    try {
      const { error } = await supabase
        .from('course_cost_actuals')
        .update(updates)
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense updated successfully",
      });

      await fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const getExpenseAnalytics = () => {
    const analytics = {
      totalExpenses: expenses.length,
      totalAmount: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.amount || 0), 0),
      pendingAmount: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0),
      byStatus: {} as Record<string, number>,
      byCostType: {} as Record<string, number>,
      byMonth: [] as any[],
    };

    // Group by status
    expenses.forEach(expense => {
      analytics.byStatus[expense.status || 'unknown'] = (analytics.byStatus[expense.status || 'unknown'] || 0) + 1;
    });

    // Group by cost type
    expenses.forEach(expense => {
      analytics.byCostType[expense.cost_type] = (analytics.byCostType[expense.cost_type] || 0) + (expense.amount || 0);
    });

    // Group by month
    const monthlyData: { [key: string]: number } = {};
    expenses.forEach(expense => {
      if (expense.expense_date) {
        const month = new Date(expense.expense_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        monthlyData[month] = (monthlyData[month] || 0) + (expense.amount || 0);
      }
    });

    analytics.byMonth = Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount,
    }));

    return analytics;
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return {
    expenses,
    loading,
    createExpense,
    updateExpenseStatus,
    updateExpense,
    getExpenseAnalytics,
    refetch: fetchExpenses,
  };
}