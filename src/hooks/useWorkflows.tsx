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
      const { data, error } = await supabase
        .from('workflow_definitions')
        .select('id, name, description, category, status, definition, created_at, updated_at, created_by')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((row: any) => {
        const def: any = (row as any).definition || {};
        return {
          id: row.id,
          name: row.name,
          description: row.description ?? '',
          category: row.category as WorkflowDefinition['category'],
          status: row.status as WorkflowDefinition['status'],
          nodes: def.nodes ?? [],
          edges: def.edges ?? [],
          created_at: row.created_at,
          updated_at: row.updated_at,
          created_by: row.created_by ?? '',
        } as WorkflowDefinition;
      });

      setWorkflows(mapped);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (workflowData: Partial<WorkflowDefinition>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      const payload = {
        name: workflowData.name!,
        description: workflowData.description || '',
        category: workflowData.category!,
        status: 'draft',
        version: 1,
        definition: JSON.parse(JSON.stringify({
          nodes: workflowData.nodes || [],
          edges: workflowData.edges || [],
        })) as any,
        created_by: userId,
        updated_by: userId,
      };

      const { data, error } = await supabase
        .from('workflow_definitions')
        .insert(payload)
        .select('id, name, description, category, status, definition, created_at, updated_at, created_by')
        .single();

      if (error) throw error;

      const defCreate: any = (data as any).definition || {};
      const newWorkflow: WorkflowDefinition = {
        id: data.id,
        name: data.name,
        description: data.description ?? '',
        category: data.category as WorkflowDefinition['category'],
        status: data.status as WorkflowDefinition['status'],
        nodes: defCreate.nodes ?? [],
        edges: defCreate.edges ?? [],
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: (data as any).created_by ?? '',
      };

      setWorkflows((prev) => [newWorkflow, ...prev]);
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
      const updates: any = {
        updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      };
      if (typeof workflowData.name !== 'undefined') updates.name = workflowData.name;
      if (typeof workflowData.description !== 'undefined') updates.description = workflowData.description;
      if (typeof workflowData.category !== 'undefined') updates.category = workflowData.category;
      if (typeof workflowData.status !== 'undefined') updates.status = workflowData.status;

      if (typeof workflowData.nodes !== 'undefined' || typeof workflowData.edges !== 'undefined') {
        // Find existing to merge nodes/edges if only one is provided
        const existing = workflows.find(w => w.id === id);
        const nodes = workflowData.nodes ?? existing?.nodes ?? [];
        const edges = workflowData.edges ?? existing?.edges ?? [];
        updates.definition = JSON.parse(JSON.stringify({ nodes, edges })) as any;
      }

      const { data, error } = await supabase
        .from('workflow_definitions')
        .update(updates)
        .eq('id', id)
        .select('id, name, description, category, status, definition, created_at, updated_at, created_by')
        .single();

      if (error) throw error;

      const defUpd: any = (data as any).definition || {};
      const updated: WorkflowDefinition = {
        id: data.id,
        name: data.name,
        description: data.description ?? '',
        category: data.category as WorkflowDefinition['category'],
        status: data.status as WorkflowDefinition['status'],
        nodes: defUpd.nodes ?? [],
        edges: defUpd.edges ?? [],
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: (data as any).created_by ?? '',
      };

      setWorkflows((prev) => prev.map(w => (w.id === id ? updated : w)));
      toast.success('Workflow updated successfully');
      return updated;
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast.error('Failed to update workflow');
      throw error;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workflow_definitions')
        .delete()
        .eq('id', id);
      if (error) throw error;

      setWorkflows((prev) => prev.filter(workflow => workflow.id !== id));
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

  const applyWorkflowToEntity = async (workflowId: string, entityType: string, entityId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      const { data: defRow, error: defErr } = await supabase
        .from('workflow_definitions')
        .select('version')
        .eq('id', workflowId)
        .maybeSingle();
      if (defErr) throw defErr;

      const version = (defRow as any)?.version ?? 1;

      const { data, error } = await supabase
        .from('workflow_instances')
        .insert({
          workflow_id: workflowId,
          definition_version: version,
          entity_type: entityType,
          entity_id: entityId,
          status: 'running',
          started_by: userId,
        })
        .select('id')
        .single();

      if (error) throw error;
      toast.success('Workflow applied to entity');
      return data.id as string;
    } catch (error) {
      console.error('Error applying workflow:', error);
      toast.error('Failed to apply workflow');
      throw error;
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
    applyWorkflowToEntity,
    refetch: fetchWorkflows,
  };
}
