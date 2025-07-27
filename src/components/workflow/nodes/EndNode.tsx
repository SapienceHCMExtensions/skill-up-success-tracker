import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';

interface EndNodeProps {
  data: {
    label: string;
    description?: string;
  };
}

function EndNode({ data }: EndNodeProps) {
  return (
    <div className="px-4 py-3 rounded-lg bg-red-100 border-2 border-red-300 min-w-[120px]">
      <div className="flex items-center gap-2">
        <Square className="w-4 h-4 text-red-600" />
        <div className="font-medium text-red-800">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-xs text-red-600 mt-1">{data.description}</div>
      )}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-red-400 border-red-600"
      />
    </div>
  );
}

export default memo(EndNode);