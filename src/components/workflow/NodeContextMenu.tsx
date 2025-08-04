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
  onTest?: (nodeId: string) => void;
  onPreview?: (nodeId: string) => void;
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
  onTest,
  onPreview,
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

  const handleTest = () => {
    onTest?.(nodeId);
  };

  const handlePreview = () => {
    onPreview?.(nodeId);
  };

  const canEdit = nodeType !== 'start' && nodeType !== 'end';
  const canDelete = nodeType !== 'start';
  
  // Node-specific menu items
  const getNodeSpecificItems = () => {
    switch (nodeType) {
      case 'condition':
        return [
          <ContextMenuItem key="configure" onClick={handleConfigure} className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure Condition
          </ContextMenuItem>,
          <ContextMenuItem key="test" onClick={handleTest} className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Test Condition
          </ContextMenuItem>
        ];
      case 'action':
        return [
          <ContextMenuItem key="configure" onClick={handleConfigure} className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure Action
          </ContextMenuItem>,
          <ContextMenuItem key="preview" onClick={handlePreview} className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Preview Changes
          </ContextMenuItem>
        ];
      case 'notification':
        return [
          <ContextMenuItem key="configure" onClick={handleConfigure} className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure Recipients
          </ContextMenuItem>
        ];
      case 'approval':
        return [
          <ContextMenuItem key="configure" onClick={handleConfigure} className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure Approver
          </ContextMenuItem>
        ];
      default:
        return hasConfig ? [
          <ContextMenuItem key="configure" onClick={handleConfigure} className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </ContextMenuItem>
        ] : [];
    }
  };

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
        
        {/* Node-specific configuration items */}
        {getNodeSpecificItems()}
        
        <ContextMenuItem onClick={handleDuplicate} className="flex items-center gap-2">
          <Copy className="w-4 h-4" />
          Duplicate Node
        </ContextMenuItem>
        
        {(canEdit || hasConfig || getNodeSpecificItems().length > 0) && <ContextMenuSeparator />}
        
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