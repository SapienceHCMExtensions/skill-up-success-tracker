import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bell } from 'lucide-react';
import { NodeContextMenu } from '../NodeContextMenu';

interface NotificationNodeProps {
  id: string;
  data: {
    label: string;
    description?: string;
    config?: {
      recipients: string[];
      template: string;
    };
  };
  selected?: boolean;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
  onTest?: (nodeId: string) => void;
  onPreview?: (nodeId: string) => void;
}

function NotificationNode({ id, data, selected, onEdit, onDelete, onDuplicate, onConfigure, onTest, onPreview }: NotificationNodeProps) {
  return (
    <NodeContextMenu
      nodeId={id}
      nodeType="notification"
      hasConfig={true}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onConfigure={onConfigure}
      onTest={onTest}
      onPreview={onPreview}
    >
      <div className={`px-4 py-3 rounded-lg bg-purple-100 border-2 min-w-[140px] ${
        selected ? 'border-purple-500' : 'border-purple-300'
      }`}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-600" />
          <div className="font-medium text-purple-800">{data.label}</div>
        </div>
        {data.description && (
          <div className="text-xs text-purple-600 mt-1">{data.description}</div>
        )}
        {data.config?.recipients && (
          <div className="text-xs text-purple-700 mt-2">
            To: {data.config.recipients.join(', ')}
          </div>
        )}
        
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-purple-400 border-purple-600"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-purple-400 border-purple-600"
        />
      </div>
    </NodeContextMenu>
  );
}

export default memo(NotificationNode);