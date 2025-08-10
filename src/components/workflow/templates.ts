import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow'

export type WorkflowTemplate = {
  id: string
  name: string
  description: string
  category: WorkflowDefinition['category']
  definition: Partial<WorkflowDefinition>
}

const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`

function trainingApprovalBasic(): WorkflowTemplate {
  const startId = rid('start')
  const condId = rid('cond')
  const apprId = rid('appr')
  const actId = rid('act')
  const endId = rid('end')

  const nodes: WorkflowNode[] = [
    { id: startId, type: 'start', position: { x: 80, y: 80 }, data: { label: 'Start' } } as WorkflowNode,
    {
      id: condId,
      type: 'condition',
      position: { x: 280, y: 80 },
      data: {
        label: 'Amount > 1000?',
        entityType: 'training_requests',
        condition: { logic: 'all', rules: [{ field: 'estimated_cost', operator: '>', value: 1000 }] },
      },
    } as WorkflowNode,
    {
      id: apprId,
      type: 'approval',
      position: { x: 520, y: 20 },
      data: { label: 'Manager Approval', assignedRole: 'manager', entityType: 'training_requests', entityField: 'status' },
    } as WorkflowNode,
    {
      id: actId,
      type: 'action',
      position: { x: 520, y: 140 },
      data: { label: 'Auto Approve', entityType: 'training_requests', action: { type: 'update_status', entityUpdates: { status: 'approved' } } },
    } as WorkflowNode,
    { id: endId, type: 'end', position: { x: 740, y: 80 }, data: { label: 'End' } } as WorkflowNode,
  ]

  const edges: WorkflowEdge[] = [
    { id: rid('e'), source: startId, target: condId },
    { id: rid('e'), source: condId, target: apprId, label: 'True' },
    { id: rid('e'), source: condId, target: actId, label: 'False' },
    { id: rid('e'), source: apprId, target: endId },
    { id: rid('e'), source: actId, target: endId },
  ] as WorkflowEdge[]

  return {
    id: 'tmpl-training-approval-basic',
    name: 'Training Request Approval (Basic)',
    description: 'Submit → Amount check → Manager approval → Mark Approved → End',
    category: 'training_request',
    definition: {
      name: 'Training Request Approval',
      description: 'Basic approval flow based on estimated cost',
      category: 'training_request',
      status: 'draft',
      nodes,
      edges,
    },
  }
}

function expenseApproval(): WorkflowTemplate {
  const startId = rid('start')
  const apprId = rid('appr')
  const notifId = rid('notif')
  const endId = rid('end')

  const nodes: WorkflowNode[] = [
    { id: startId, type: 'start', position: { x: 80, y: 100 }, data: { label: 'Start' } } as WorkflowNode,
    {
      id: apprId,
      type: 'approval',
      position: { x: 300, y: 100 },
      data: { label: 'Finance Approval', assignedRole: 'finance', entityType: 'course_cost_actuals', entityField: 'status' },
    } as WorkflowNode,
    {
      id: notifId,
      type: 'notification',
      position: { x: 520, y: 100 },
      data: { label: 'Notify Requester', notification: { subject: 'Your expense has been processed', recipients: [], template: 'Expense {{invoice_no}} has been {{status}}.' } },
    } as WorkflowNode,
    { id: endId, type: 'end', position: { x: 740, y: 100 }, data: { label: 'End' } } as WorkflowNode,
  ]

  const edges: WorkflowEdge[] = [
    { id: rid('e'), source: startId, target: apprId },
    { id: rid('e'), source: apprId, target: notifId },
    { id: rid('e'), source: notifId, target: endId },
  ]

  return {
    id: 'tmpl-expense-approval',
    name: 'Expense Approval',
    description: 'Submit expense → Finance approval → Notify → End',
    category: 'expense_approval',
    definition: {
      name: 'Course Expense Approval',
      description: 'Finance approval for course expenses',
      category: 'expense_approval',
      status: 'draft',
      nodes,
      edges,
    },
  }
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [trainingApprovalBasic(), expenseApproval()]
