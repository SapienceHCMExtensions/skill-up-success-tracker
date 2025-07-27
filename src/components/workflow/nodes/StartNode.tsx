import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

interface StartNodeProps {
  data: {
    label: string;
    description?: string;
  };
}

function StartNode({ data }: StartNodeProps) {
  return (
    <div className="px-4 py-3 rounded-lg bg-green-100 border-2 border-green-300 min-w-[120px]">
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4 text-green-600" />
        <div className="font-medium text-green-800">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-xs text-green-600 mt-1">{data.description}</div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-400 border-green-600"
      />
    </div>
  );
}

export default memo(StartNode);