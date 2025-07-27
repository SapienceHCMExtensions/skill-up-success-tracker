import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle, Clock } from 'lucide-react';

interface ApprovalNodeProps {
  data: {
    label: string;
    description?: string;
    config?: {
      approver_role?: string;
      approver_user?: string;
      timeout_hours?: number;
    };
  };
  selected?: boolean;
}

function ApprovalNode({ data, selected }: ApprovalNodeProps) {
  return (
    <div className={`px-4 py-3 rounded-lg bg-yellow-100 border-2 min-w-[140px] ${
      selected ? 'border-yellow-500' : 'border-yellow-300'
    }`}>
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-yellow-600" />
        <div className="font-medium text-yellow-800">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-xs text-yellow-600 mt-1">{data.description}</div>
      )}
      {data.config?.approver_role && (
        <div className="text-xs text-yellow-700 mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Approver: {data.config.approver_role}
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-yellow-400 border-yellow-600"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-yellow-400 border-yellow-600"
      />
    </div>
  );
}

export default memo(ApprovalNode);