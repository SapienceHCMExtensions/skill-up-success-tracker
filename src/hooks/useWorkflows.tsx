import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WorkflowDefinition } from '@/types/workflow';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      // For now, we'll store workflows in localStorage until we add database tables
      const stored = localStorage.getItem('workflows');
      if (stored) {
        setWorkflows(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (workflowData: Partial<WorkflowDefinition>) => {
    try {
      const newWorkflow: WorkflowDefinition = {
        id: `workflow-${Date.now()}`,
        name: workflowData.name!,
        description: workflowData.description || '',
        category: workflowData.category!,
        status: 'draft',
        nodes: workflowData.nodes || [],
        edges: workflowData.edges || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'current-user', // This should come from auth context
      };

      const updatedWorkflows = [...workflows, newWorkflow];
      setWorkflows(updatedWorkflows);
      localStorage.setItem('workflows', JSON.stringify(updatedWorkflows));
      
      toast.success('Workflow created successfully');
      return newWorkflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
      throw error;
    }
  };

  const updateWorkflow = async (id: string, workflowData: Partial<WorkflowDefinition>) => {
    try {
      const updatedWorkflows = workflows.map(workflow => 
        workflow.id === id 
          ? { 
              ...workflow, 
              ...workflowData, 
              updated_at: new Date().toISOString() 
            }
          : workflow
      );
      
      setWorkflows(updatedWorkflows);
      localStorage.setItem('workflows', JSON.stringify(updatedWorkflows));
      
      toast.success('Workflow updated successfully');
      return updatedWorkflows.find(w => w.id === id);
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast.error('Failed to update workflow');
      throw error;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      const updatedWorkflows = workflows.filter(workflow => workflow.id !== id);
      setWorkflows(updatedWorkflows);
      localStorage.setItem('workflows', JSON.stringify(updatedWorkflows));
      
      toast.success('Workflow deleted successfully');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
      throw error;
    }
  };

  const activateWorkflow = async (id: string) => {
    try {
      await updateWorkflow(id, { status: 'active' });
      toast.success('Workflow activated');
    } catch (error) {
      console.error('Error activating workflow:', error);
      toast.error('Failed to activate workflow');
    }
  };

  const deactivateWorkflow = async (id: string) => {
    try {
      await updateWorkflow(id, { status: 'inactive' });
      toast.success('Workflow deactivated');
    } catch (error) {
      console.error('Error deactivating workflow:', error);
      toast.error('Failed to deactivate workflow');
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return {
    workflows,
    loading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    refetch: fetchWorkflows,
  };
}