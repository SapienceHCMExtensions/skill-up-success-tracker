import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

interface ActionNodeProps {
  data: {
    label: string;
    description?: string;
    config?: {
      type: string;
      parameters: Record<string, any>;
    };
  };
  selected?: boolean;
}

function ActionNode({ data, selected }: ActionNodeProps) {
  return (
    <div className={`px-4 py-3 rounded-lg bg-orange-100 border-2 min-w-[140px] ${
      selected ? 'border-orange-500' : 'border-orange-300'
    }`}>
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-orange-600" />
        <div className="font-medium text-orange-800">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-xs text-orange-600 mt-1">{data.description}</div>
      )}
      {data.config?.type && (
        <div className="text-xs text-orange-700 mt-2">
          Action: {data.config.type}
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-400 border-orange-600"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-400 border-orange-600"
      />
    </div>
  );
}

export default memo(ActionNode);