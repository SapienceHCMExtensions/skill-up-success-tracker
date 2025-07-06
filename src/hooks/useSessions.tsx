import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Session = Tables<'sessions'>;
type SessionInsert = TablesInsert<'sessions'>;
type SessionUpdate = TablesUpdate<'sessions'>;

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          courses (
            title,
            code,
            duration_hours
          ),
          employees:instructor_id (
            name,
            email
          )
        `)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch training sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionData: SessionInsert) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select(`
          *,
          courses (
            title,
            code,
            duration_hours
          ),
          employees:instructor_id (
            name,
            email
          )
        `)
        .single();

      if (error) throw error;

      setSessions(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Training session scheduled successfully",
      });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule training session",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateSession = async (id: string, sessionData: SessionUpdate) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', id)
        .select(`
          *,
          courses (
            title,
            code,
            duration_hours
          ),
          employees:instructor_id (
            name,
            email
          )
        `)
        .single();

      if (error) throw error;

      setSessions(prev => prev.map(session => 
        session.id === id ? data : session
      ));
      
      toast({
        title: "Success",
        description: "Training session updated successfully",
      });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update training session",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      setSessions(prev => prev.map(session => 
        session.id === id ? { ...session, status: 'cancelled' as const } : session
      ));
      
      toast({
        title: "Success",
        description: "Training session cancelled successfully",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Error cancelling session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel training session",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions,
  };
}