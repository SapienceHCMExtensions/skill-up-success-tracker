import { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Edit, Trash2, Copy, Settings } from 'lucide-react';

interface NodeContextMenuProps {
  children: ReactNode;
  nodeId: string;
  nodeType: string;
  hasConfig?: boolean;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
}

export function NodeContextMenu({
  children,
  nodeId,
  nodeType,
  hasConfig = false,
  onEdit,
  onDelete,
  onDuplicate,
  onConfigure,
}: NodeContextMenuProps) {
  const handleEdit = () => {
    onEdit?.(nodeId);
  };

  const handleDelete = () => {
    onDelete?.(nodeId);
  };

  const handleDuplicate = () => {
    onDuplicate?.(nodeId);
  };

  const handleConfigure = () => {
    onConfigure?.(nodeId);
  };

  const canEdit = nodeType !== 'start' && nodeType !== 'end';
  const canDelete = nodeType !== 'start';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {canEdit && (
          <ContextMenuItem onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Node
          </ContextMenuItem>
        )}
        
        {hasConfig && (
          <ContextMenuItem onClick={handleConfigure} className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </ContextMenuItem>
        )}
        
        <ContextMenuItem onClick={handleDuplicate} className="flex items-center gap-2">
          <Copy className="w-4 h-4" />
          Duplicate Node
        </ContextMenuItem>
        
        {(canEdit || hasConfig) && <ContextMenuSeparator />}
        
        {canDelete && (
          <ContextMenuItem 
            onClick={handleDelete} 
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Delete Node
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}