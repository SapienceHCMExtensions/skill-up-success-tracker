import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface ConditionNodeProps {
  data: {
    label: string;
    description?: string;
    config?: {
      field: string;
      operator: string;
      value: any;
    };
  };
  selected?: boolean;
}

function ConditionNode({ data, selected }: ConditionNodeProps) {
  return (
    <div className={`px-4 py-3 rounded-lg bg-blue-100 border-2 min-w-[140px] ${
      selected ? 'border-blue-500' : 'border-blue-300'
    }`}>
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-blue-600" />
        <div className="font-medium text-blue-800">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-xs text-blue-600 mt-1">{data.description}</div>
      )}
      {data.config && (
        <div className="text-xs text-blue-700 mt-2">
          {data.config.field} {data.config.operator} {data.config.value}
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-400 border-blue-600"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="true"
        className="w-3 h-3 bg-green-400 border-green-600"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 bg-red-400 border-red-600"
      />
    </div>
  );
}

export default memo(ConditionNode);