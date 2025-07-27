import { Node, Edge } from '@xyflow/react';

export interface WorkflowNode extends Node {
  type: 'start' | 'approval' | 'condition' | 'notification' | 'action' | 'end';
  data: {
    label: string;
    description?: string;
    config?: Record<string, any>;
  };
}

export interface WorkflowEdge extends Edge {
  label?: string;
  condition?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  category: 'training_request' | 'course_enrollment' | 'certification' | 'expense_approval';
  status: 'draft' | 'active' | 'inactive';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  entity_id: string; // ID of the training request, course, etc.
  entity_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  current_node: string;
  started_at: string;
  completed_at?: string;
  variables: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  instance_id: string;
  node_id: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  result?: Record<string, any>;
  notes?: string;
}

export interface NodeConfig {
  approval: {
    approver_role?: string;
    approver_user?: string;
    auto_approve_conditions?: string[];
    timeout_hours?: number;
  };
  condition: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
    true_path?: string;
    false_path?: string;
  };
  notification: {
    recipients: string[];
    template: string;
    variables?: Record<string, string>;
  };
  action: {
    type: 'update_status' | 'send_email' | 'create_record' | 'custom';
    parameters: Record<string, any>;
  };
}