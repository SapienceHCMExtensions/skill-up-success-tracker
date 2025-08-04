import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { WorkflowNode } from "@/types/workflow"
import { DatabaseEntitySelector, DatabaseFieldSelector } from "./DatabaseEntitySelector"

interface WorkflowNodeEditorProps {
  node: WorkflowNode | null
  isOpen: boolean
  onClose: () => void
  onSave: (node: WorkflowNode) => void
}

export function WorkflowNodeEditor({ node, isOpen, onClose, onSave }: WorkflowNodeEditorProps) {
  const [formData, setFormData] = useState<Partial<WorkflowNode['data']>>({})

  const handleSave = () => {
    if (!node) return
    
    const updatedNode: WorkflowNode = {
      ...node,
      data: {
        ...node.data,
        ...formData
      }
    }
    
    onSave(updatedNode)
    onClose()
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateNestedFormData = (parentField: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...((prev as any)[parentField] || {}),
        [field]: value
      }
    }))
  }

  if (!node) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={formData.label || node.data.label}
              onChange={(e) => updateFormData('label', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description || node.data.description || ''}
              onChange={(e) => updateFormData('description', e.target.value)}
            />
          </div>

          {/* Database Entity Selection */}
          <DatabaseEntitySelector
            value={formData.entityType || node.data.entityType}
            onValueChange={(value) => updateFormData('entityType', value)}
            label="Database Entity"
            placeholder="Select database table..."
          />

          {/* Node Type Specific Fields */}
          {node.type === 'approval' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assigned Role</Label>
                <Select
                  value={formData.assignedRole || node.data.assignedRole}
                  onValueChange={(value) => updateFormData('assignedRole', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.entityType || node.data.entityType) && (
                <DatabaseFieldSelector
                  entityType={formData.entityType || node.data.entityType}
                  value={formData.entityField || node.data.entityField}
                  onValueChange={(value) => updateFormData('entityField', value)}
                  label="Field to Update on Approval"
                />
              )}

              <div className="space-y-2">
                <Label>Approval Criteria</Label>
                <Input
                  value={formData.approvalCriteria?.condition || node.data.approvalCriteria?.condition || ''}
                  onChange={(e) => updateNestedFormData('approvalCriteria', 'condition', e.target.value)}
                  placeholder="e.g., amount > 1000"
                />
              </div>
            </div>
          )}

          {node.type === 'condition' && (
            <div className="space-y-4">
              {(formData.entityType || node.data.entityType) && (
                <DatabaseFieldSelector
                  entityType={formData.entityType || node.data.entityType}
                  value={formData.condition?.entityField || node.data.condition?.entityField}
                  onValueChange={(value) => updateNestedFormData('condition', 'entityField', value)}
                  label="Database Field"
                />
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Input
                    value={formData.condition?.field || node.data.condition?.field || ''}
                    onChange={(e) => updateNestedFormData('condition', 'field', e.target.value)}
                    placeholder="Field name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operator</Label>
                  <Select
                    value={formData.condition?.operator || node.data.condition?.operator}
                    onValueChange={(value) => updateNestedFormData('condition', 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="=">=</SelectItem>
                      <SelectItem value="!=">!=</SelectItem>
                      <SelectItem value=">">&gt;</SelectItem>
                      <SelectItem value="<">&lt;</SelectItem>
                      <SelectItem value=">=">&gt;=</SelectItem>
                      <SelectItem value="<=">&lt;=</SelectItem>
                      <SelectItem value="contains">contains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    value={formData.condition?.value || node.data.condition?.value || ''}
                    onChange={(e) => updateNestedFormData('condition', 'value', e.target.value)}
                    placeholder="Value"
                  />
                </div>
              </div>
            </div>
          )}

          {node.type === 'action' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select
                  value={formData.action?.type || node.data.action?.type}
                  onValueChange={(value) => updateNestedFormData('action', 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update_status">Update Status</SelectItem>
                    <SelectItem value="send_email">Send Email</SelectItem>
                    <SelectItem value="create_record">Create Record</SelectItem>
                    <SelectItem value="assign_user">Assign User</SelectItem>
                    <SelectItem value="calculate_cost">Calculate Cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.entityType || node.data.entityType) && (
                <div className="space-y-2">
                  <Label>Database Updates</Label>
                  <div className="text-xs text-muted-foreground mb-2">
                    Configure field updates for the selected entity
                  </div>
                  {/* Simplified - you could expand this to be more dynamic */}
                  <Input
                    placeholder='{"status": "approved", "approved_at": "now()"}'
                    value={JSON.stringify(formData.action?.entityUpdates || node.data.action?.entityUpdates || {})}
                    onChange={(e) => {
                      try {
                        const updates = JSON.parse(e.target.value)
                        updateNestedFormData('action', 'entityUpdates', updates)
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {node.type === 'notification' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={formData.notification?.subject || node.data.notification?.subject || ''}
                  onChange={(e) => updateNestedFormData('notification', 'subject', e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label>Recipients</Label>
                <Input
                  value={formData.notification?.recipients?.join(', ') || node.data.notification?.recipients?.join(', ') || ''}
                  onChange={(e) => updateNestedFormData('notification', 'recipients', e.target.value.split(', ').filter(Boolean))}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>

              {(formData.entityType || node.data.entityType) && (
                <div className="space-y-2">
                  <Label>Include Entity Fields</Label>
                  <Input
                    value={formData.notification?.entityFields?.join(', ') || node.data.notification?.entityFields?.join(', ') || ''}
                    onChange={(e) => updateNestedFormData('notification', 'entityFields', e.target.value.split(', ').filter(Boolean))}
                    placeholder="field1, field2, field3"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Template</Label>
                <Textarea
                  value={formData.notification?.template || node.data.notification?.template || ''}
                  onChange={(e) => updateNestedFormData('notification', 'template', e.target.value)}
                  placeholder="Email template content"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}