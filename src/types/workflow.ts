import { Node, Edge } from '@xyflow/react';

export interface DatabaseField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

export interface DatabaseEntity {
  table: string;
  label: string;
  fields: DatabaseField[];
}

export const DATABASE_ENTITIES: DatabaseEntity[] = [
  {
    table: 'training_requests',
    label: 'Training Requests',
    fields: [
      { name: 'id', label: 'ID', type: 'uuid', required: true },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'enum', required: true },
      { name: 'employee_id', label: 'Employee', type: 'uuid', required: true },
      { name: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
      { name: 'justification', label: 'Justification', type: 'text' },
      { name: 'approved_by', label: 'Approved By', type: 'uuid' },
      { name: 'approval_date', label: 'Approval Date', type: 'datetime' }
    ]
  },
  {
    table: 'sessions',
    label: 'Training Sessions',
    fields: [
      { name: 'id', label: 'ID', type: 'uuid', required: true },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'enum', required: true },
      { name: 'course_id', label: 'Course', type: 'uuid', required: true },
      { name: 'instructor_id', label: 'Instructor', type: 'uuid' },
      { name: 'start_date', label: 'Start Date', type: 'datetime', required: true },
      { name: 'end_date', label: 'End Date', type: 'datetime', required: true },
      { name: 'max_seats', label: 'Max Seats', type: 'number' }
    ]
  },
  {
    table: 'course_cost_actuals',
    label: 'Course Expenses',
    fields: [
      { name: 'id', label: 'ID', type: 'uuid', required: true },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'status', label: 'Status', type: 'text', required: true },
      { name: 'employee_id', label: 'Employee', type: 'uuid', required: true },
      { name: 'approved_by', label: 'Approved By', type: 'uuid' },
      { name: 'approved_at', label: 'Approved Date', type: 'datetime' }
    ]
  },
  {
    table: 'employees',
    label: 'Employees',
    fields: [
      { name: 'id', label: 'ID', type: 'uuid', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'text', required: true },
      { name: 'department_id', label: 'Department', type: 'uuid' }
    ]
  }
];

export interface WorkflowNode extends Node {
  type: 'start' | 'approval' | 'condition' | 'notification' | 'action' | 'end';
  data: {
    label: string;
    description?: string;
    config?: Record<string, any>;
    entityType?: string;
    entityField?: string;
    assignedRole?: string;
    approvalCriteria?: {
      condition?: string;
    };
    condition?: {
      // legacy single-rule support
      field?: string;
      operator?: string;
      value?: any;
      entityField?: string;
      // multi-rule group support
      logic?: 'all' | 'any';
      rules?: Array<{
        field: string;
        operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | '=' | '!=' | '>' | '<' | '>=' | '<=';
        value: any;
      }>;
    };
    action?: {
      type?: string;
      entityUpdates?: Record<string, any>;
    };
    notification?: {
      subject?: string;
      recipients?: string[];
      entityFields?: string[];
      template?: string;
    };
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