import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { NodeContextMenu } from '../NodeContextMenu';

interface ConditionNodeProps {
  id: string;
  data: {
    label: string;
    description?: string;
    config?: {
      field?: string;
      operator?: string;
      value?: any;
    };
    condition?: {
      logic?: 'all' | 'any';
      rules?: { field: string; operator: string; value: any }[];
      field?: string;
      operator?: string;
      value?: any;
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

function ConditionNode({ id, data, selected, onEdit, onDelete, onDuplicate, onConfigure, onTest, onPreview }: ConditionNodeProps) {
  return (
    <NodeContextMenu
      nodeId={id}
      nodeType="condition"
      hasConfig={true}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onConfigure={onConfigure}
      onTest={onTest}
      onPreview={onPreview}
    >
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
        {(() => {
          const cond: any = (data as any).condition ?? (data as any).config;
          if (!cond) return null;
          const hasGroup = Array.isArray(cond.rules) && cond.rules.length > 0;
          return (
            <div className="text-xs text-blue-700 mt-2 space-y-1">
              {hasGroup ? (
                <>
                  <div>Match {cond.logic === 'any' ? 'ANY' : 'ALL'}:</div>
                  {(cond.rules as any[]).slice(0, 3).map((r, i) => (
                    <div key={i}>{r.field} {r.operator} {String(r.value)}</div>
                  ))}
                  {cond.rules.length > 3 && (
                    <div>+{cond.rules.length - 3} more…</div>
                  )}
                </>
              ) : (
                cond.field ? <div>{cond.field} {cond.operator} {String(cond.value)}</div> : null
              )}
            </div>
          );
        })()}

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
    </NodeContextMenu>
  );
}

export default memo(ConditionNode);