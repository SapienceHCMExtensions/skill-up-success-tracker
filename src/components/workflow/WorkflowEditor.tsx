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
import { WorkflowNodeEditor } from './WorkflowNodeEditor';
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

const createNodeTypes = (
  onEdit: (nodeId: string) => void,
  onDelete: (nodeId: string) => void,
  onDuplicate: (nodeId: string) => void
) => ({
  start: (props: any) => <StartNode {...props} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />,
  approval: (props: any) => <ApprovalNode {...props} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />,
  condition: (props: any) => <ConditionNode {...props} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />,
  notification: (props: any) => <NotificationNode {...props} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />,
  action: (props: any) => <ActionNode {...props} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />,
  end: (props: any) => <EndNode {...props} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />,
});

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
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  
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

  const handleEditNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setEditingNode(node);
      setShowNodeEditor(true);
    }
  }, [nodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    toast.success('Node deleted');
  }, [setNodes, setEdges]);

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find((node) => node.id === nodeId);
    if (!nodeToDuplicate) return;

    const newId = `${nodeToDuplicate.type}-${nodeIdCounter.current++}`;
    const newNode: WorkflowNode = {
      ...nodeToDuplicate,
      id: newId,
      position: {
        x: nodeToDuplicate.position.x + 100,
        y: nodeToDuplicate.position.y + 50,
      },
    };

    setNodes((nds) => nds.concat(newNode));
    toast.success('Node duplicated');
  }, [nodes, setNodes]);

  const handleSaveNodeConfig = useCallback((updatedNode: WorkflowNode) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === updatedNode.id ? updatedNode : node
      )
    );
    setShowNodeEditor(false);
    setEditingNode(null);
    toast.success('Node configuration saved');
  }, [setNodes]);

  const handleCancelNodeEdit = useCallback(() => {
    setShowNodeEditor(false);
    setEditingNode(null);
  }, []);

  const canSave = workflowName.trim().length > 0 && nodes.length > 0;
  const nodeTypes = createNodeTypes(handleEditNode, handleDeleteNode, handleDuplicateNode);

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

      {/* Node Editor Dialog */}
      <WorkflowNodeEditor
        node={editingNode}
        isOpen={showNodeEditor}
        onClose={handleCancelNodeEdit}
        onSave={handleSaveNodeConfig}
      />
    </div>
  );
}