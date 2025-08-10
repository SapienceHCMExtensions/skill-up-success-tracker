import { useState } from 'react';
import { Plus, Edit, Trash2, Play, Pause, Eye, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { WorkflowEditor } from '@/components/workflow/WorkflowEditor';
import { useWorkflows } from '@/hooks/useWorkflows';
import type { WorkflowDefinition } from '@/types/workflow';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

export default function Workflows() {
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDefinition | undefined>();
  
  const [instancesOpen, setInstancesOpen] = useState(false);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedWorkflowForInstances, setSelectedWorkflowForInstances] = useState<WorkflowDefinition | null>(null);
  
  const {
    workflows,
    loading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    applyWorkflowToEntity,
  } = useWorkflows();

  const openInstances = async (wf: WorkflowDefinition) => {
    setSelectedWorkflowForInstances(wf);
    setInstancesOpen(true);
    setInstancesLoading(true);
    const { data, error } = await supabase
      .from('workflow_instances')
      .select('id, status, entity_type, entity_id, created_at')
      .eq('workflow_id', wf.id)
      .order('created_at', { ascending: false });
    if (!error) {
      setInstances(data || []);
    }
    setInstancesLoading(false);
  };

  const handleCreateNew = () => {
    setEditingWorkflow(undefined);
    setShowEditor(true);
  };

  const handleEdit = (workflow: WorkflowDefinition) => {
    setEditingWorkflow(workflow);
    setShowEditor(true);
  };

  const handleSave = async (workflowData: Partial<WorkflowDefinition>) => {
    try {
      if (editingWorkflow) {
        await updateWorkflow(editingWorkflow.id, workflowData);
      } else {
        await createWorkflow(workflowData);
      }
      setShowEditor(false);
      setEditingWorkflow(undefined);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingWorkflow(undefined);
  };

  const getStatusBadge = (status: WorkflowDefinition['status']) => {
    const variants = {
      draft: { variant: 'secondary' as const, text: 'Draft' },
      active: { variant: 'default' as const, text: 'Active' },
      inactive: { variant: 'outline' as const, text: 'Inactive' },
    };
    
    const { variant, text } = variants[status];
    return <Badge variant={variant}>{text}</Badge>;
  };

  const getCategoryBadge = (category: WorkflowDefinition['category']) => {
    const categoryLabels = {
      training_request: 'Training Request',
      course_enrollment: 'Course Enrollment',
      certification: 'Certification',
      expense_approval: 'Expense Approval',
    };
    
    return <Badge variant="outline">{categoryLabels[category]}</Badge>;
  };

  if (showEditor) {
    return (
      <div className="h-screen">
        <WorkflowEditor
          workflow={editingWorkflow}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Management</h1>
          <p className="text-muted-foreground">
            Configure automated workflows for training management processes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link to="/my-tasks">
              <List className="w-4 h-4" />
              My Tasks
            </Link>
          </Button>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Workflow
          </Button>
        </div>
      </div>

      <Separator />

      {loading ? (
        <div className="text-center py-8">Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-3">
              <div className="text-muted-foreground">
                No workflows configured yet
              </div>
              <Button onClick={handleCreateNew} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-3">
                      {workflow.name}
                      {getStatusBadge(workflow.status)}
                      {getCategoryBadge(workflow.category)}
                    </CardTitle>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workflow)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    {workflow.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateWorkflow(workflow.id)}
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activateWorkflow(workflow.id)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInstances(workflow)}
                    >
                      <List className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const entityType = window.prompt('Entity type (e.g., training_requests)')?.trim();
                        const entityId = window.prompt('Entity ID (UUID)')?.trim();
                        if (entityType && entityId) {
                          try {
                            await applyWorkflowToEntity(workflow.id, entityType, entityId);
                          } catch (e) {
                            // toast handled in hook
                          }
                        }
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{workflow.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteWorkflow(workflow.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Nodes</div>
                    <div className="text-muted-foreground">
                      {workflow.nodes.length} steps
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Created</div>
                    <div className="text-muted-foreground">
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Last Updated</div>
                    <div className="text-muted-foreground">
                      {new Date(workflow.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={instancesOpen} onOpenChange={setInstancesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workflow Instances</DialogTitle>
            {selectedWorkflowForInstances && (
              <DialogDescription>
                {selectedWorkflowForInstances.name}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-2">
            {instancesLoading ? (
              <div className="text-sm text-muted-foreground">Loading instances...</div>
            ) : instances.length === 0 ? (
              <div className="text-sm text-muted-foreground">No instances found for this workflow.</div>
            ) : (
              <div className="space-y-2">
                {instances.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between rounded-md border p-2">
                    <div className="text-sm">
                      <div className="font-medium">{inst.status}</div>
                      <div className="text-muted-foreground">{inst.entity_type} • {inst.entity_id}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(inst.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}