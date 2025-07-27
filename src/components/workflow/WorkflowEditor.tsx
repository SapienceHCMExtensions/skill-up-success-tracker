import { useCallback, useState, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { WorkflowToolbar } from './WorkflowToolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Import custom nodes
import StartNode from './nodes/StartNode';
import ApprovalNode from './nodes/ApprovalNode';
import ConditionNode from './nodes/ConditionNode';
import NotificationNode from './nodes/NotificationNode';
import ActionNode from './nodes/ActionNode';
import EndNode from './nodes/EndNode';

import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow';

const nodeTypes = {
  start: StartNode,
  approval: ApprovalNode,
  condition: ConditionNode,
  notification: NotificationNode,
  action: ActionNode,
  end: EndNode,
};

interface WorkflowEditorProps {
  workflow?: WorkflowDefinition;
  onSave: (workflow: Partial<WorkflowDefinition>) => void;
  onCancel: () => void;
}

const initialNodes: WorkflowNode[] = [];
const initialEdges: WorkflowEdge[] = [];

export function WorkflowEditor({ workflow, onSave, onCancel }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflow?.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    workflow?.edges || initialEdges
  );
  
  const [workflowName, setWorkflowName] = useState(workflow?.name || '');
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '');
  const [workflowCategory, setWorkflowCategory] = useState<WorkflowDefinition['category']>(
    workflow?.category || 'training_request'
  );
  
  const nodeIdCounter = useRef(1);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback((type: string) => {
    const id = `${type}-${nodeIdCounter.current++}`;
    const position = { x: Math.random() * 400, y: Math.random() * 400 };
    
    const defaultLabels = {
      start: 'Start',
      approval: 'Approval Required',
      condition: 'Check Condition',
      notification: 'Send Notification',
      action: 'Execute Action',
      end: 'End',
    };

    const newNode: WorkflowNode = {
      id,
      type: type as WorkflowNode['type'],
      position,
      data: {
        label: defaultLabels[type as keyof typeof defaultLabels] || 'New Node',
        description: '',
      },
    };

    setNodes((nds) => nds.concat(newNode));
    toast.success(`Added ${type} node`);
  }, [setNodes]);

  const handleSave = useCallback(() => {
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Please add at least one node to the workflow');
      return;
    }

    const workflowData: Partial<WorkflowDefinition> = {
      name: workflowName,
      description: workflowDescription,
      category: workflowCategory,
      nodes: nodes as WorkflowNode[],
      edges: edges as WorkflowEdge[],
      status: 'draft',
    };

    onSave(workflowData);
  }, [workflowName, workflowDescription, workflowCategory, nodes, edges, onSave]);

  const handlePreview = useCallback(() => {
    toast.info('Preview functionality coming soon');
  }, []);

  const handleTest = useCallback(() => {
    toast.info('Test run functionality coming soon');
  }, []);

  const canSave = workflowName.trim().length > 0 && nodes.length > 0;

  return (
    <div className="h-full flex">
      {/* Left Sidebar */}
      <div className="w-80 border-r bg-background p-4 space-y-4 overflow-y-auto">
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {workflow ? 'Edit Workflow' : 'Create Workflow'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Enter workflow description"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={workflowCategory}
                onChange={(e) => setWorkflowCategory(e.target.value as WorkflowDefinition['category'])}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="training_request">Training Request</option>
                <option value="course_enrollment">Course Enrollment</option>
                <option value="certification">Certification</option>
                <option value="expense_approval">Expense Approval</option>
              </select>
            </div>
          </div>
        </div>

        <Separator />

        <WorkflowToolbar
          onAddNode={addNode}
          onSave={handleSave}
          onPreview={handlePreview}
          onTest={handleTest}
          canSave={canSave}
        />

        <Separator />

        <div className="flex gap-2">
          <Button onClick={onCancel} variant="outline" size="sm" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}