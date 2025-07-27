import { useState } from 'react';
import { Plus, Edit, Trash2, Play, Pause, Eye } from 'lucide-react';
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

export default function Workflows() {
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDefinition | undefined>();
  
  const {
    workflows,
    loading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    activateWorkflow,
    deactivateWorkflow,
  } = useWorkflows();

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
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Workflow
        </Button>
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
    </div>
  );
}