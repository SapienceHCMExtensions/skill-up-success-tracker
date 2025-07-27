import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  CheckCircle, 
  GitBranch, 
  Bell, 
  Zap, 
  Square,
  Save,
  Eye,
  Play as PlayIcon
} from 'lucide-react';

interface WorkflowToolbarProps {
  onAddNode: (type: string) => void;
  onSave: () => void;
  onPreview: () => void;
  onTest: () => void;
  canSave: boolean;
}

export function WorkflowToolbar({ 
  onAddNode, 
  onSave, 
  onPreview, 
  onTest, 
  canSave 
}: WorkflowToolbarProps) {
  const nodeTypes = [
    { type: 'start', label: 'Start', icon: Play, color: 'text-green-600' },
    { type: 'approval', label: 'Approval', icon: CheckCircle, color: 'text-yellow-600' },
    { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-blue-600' },
    { type: 'notification', label: 'Notification', icon: Bell, color: 'text-purple-600' },
    { type: 'action', label: 'Action', icon: Zap, color: 'text-orange-600' },
    { type: 'end', label: 'End', icon: Square, color: 'text-red-600' },
  ];

  return (
    <Card className="p-4 bg-background border">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Workflow Nodes</h3>
          <div className="grid grid-cols-2 gap-2">
            {nodeTypes.map((nodeType) => {
              const Icon = nodeType.icon;
              return (
                <Button
                  key={nodeType.type}
                  variant="outline"
                  size="sm"
                  onClick={() => onAddNode(nodeType.type)}
                  className="justify-start gap-2 h-auto py-2"
                >
                  <Icon className={`w-4 h-4 ${nodeType.color}`} />
                  <span className="text-xs">{nodeType.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2">Actions</h3>
          <div className="space-y-2">
            <Button
              onClick={onSave}
              disabled={!canSave}
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Save className="w-4 h-4" />
              Save Workflow
            </Button>
            
            <Button
              onClick={onPreview}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            
            <Button
              onClick={onTest}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <PlayIcon className="w-4 h-4" />
              Test Run
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}