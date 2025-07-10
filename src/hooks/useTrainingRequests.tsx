import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type TrainingRequest = Tables<'training_requests'> & {
  employee?: Partial<Tables<'employees'>>;
  requested_by_employee?: Partial<Tables<'employees'>>;
  approved_by_employee?: Partial<Tables<'employees'>>;
  course?: Partial<Tables<'courses'>>;
  session?: Partial<Tables<'sessions'>>;
};

export function useTrainingRequests() {
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('training_requests')
        .select(`
          *,
          employee:employees!training_requests_employee_id_fkey(name, email),
          requested_by_employee:employees!training_requests_requested_by_fkey(name, email),
          approved_by_employee:employees!training_requests_approved_by_fkey(name, email),
          course:courses(title, code),
          session:sessions(title, start_date)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching training requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch training requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (requestData: {
    employee_id: string;
    title: string;
    description?: string;
    training_provider?: string;
    training_date?: string;
    estimated_cost?: number;
    justification: string;
    course_id?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current employee ID
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!employee) throw new Error('Employee record not found');

      const { data, error } = await supabase
        .from('training_requests')
        .insert({
          ...requestData,
          requested_by: employee.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Training request created successfully",
      });

      await fetchRequests();
      return data;
    } catch (error) {
      console.error('Error creating training request:', error);
      toast({
        title: "Error",
        description: "Failed to create training request",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateRequestStatus = async (
    requestId: string, 
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

      const updateData: any = {
        status,
        approval_comment: comment
      };

      if (status === 'approved' || status === 'rejected') {
        updateData.approved_by = employee.id;
        updateData.approval_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('training_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Training request ${status} successfully`,
      });

      await fetchRequests();
    } catch (error) {
      console.error('Error updating training request:', error);
      toast({
        title: "Error",
        description: "Failed to update training request",
        variant: "destructive",
      });
    }
  };

  const submitForApproval = async (requestId: string) => {
    await updateRequestStatus(requestId, 'pending_approval');
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    loading,
    refetch: fetchRequests,
    createRequest,
    updateRequestStatus,
    submitForApproval
  };
}