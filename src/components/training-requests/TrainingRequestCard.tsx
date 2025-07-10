import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  DollarSign, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle,
  Send,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type TrainingRequest = Tables<'training_requests'> & {
  employee?: Partial<Tables<'employees'>>;
  requested_by_employee?: Partial<Tables<'employees'>>;
  approved_by_employee?: Partial<Tables<'employees'>>;
  course?: Partial<Tables<'courses'>>;
  session?: Partial<Tables<'sessions'>>;
};

interface TrainingRequestCardProps {
  request: TrainingRequest;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSubmitForApproval?: (id: string) => void;
  onViewDetails?: (request: TrainingRequest) => void;
  currentUserRole?: string;
}

export function TrainingRequestCard({ 
  request, 
  onApprove, 
  onReject, 
  onSubmitForApproval,
  onViewDetails,
  currentUserRole 
}: TrainingRequestCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      draft: { variant: "outline" },
      pending_approval: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      approved: { variant: "default", className: "bg-green-100 text-green-800" },
      rejected: { variant: "destructive" },
      in_progress: { variant: "default", className: "bg-blue-100 text-blue-800" },
      completed: { variant: "default", className: "bg-purple-100 text-purple-800" },
      cancelled: { variant: "outline", className: "bg-gray-100 text-gray-800" }
    };

    const config = variants[status] || { variant: "outline" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const canApproveReject = currentUserRole === 'manager' || currentUserRole === 'admin';
  const canSubmitForApproval = request.status === 'draft';
  const showApprovalActions = canApproveReject && request.status === 'pending_approval';

  return (
    <Card className="hover:shadow-hover transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{request.title}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{request.employee?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(request.created_at!), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>
          {getStatusBadge(request.status!)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {request.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.description}
          </p>
        )}

        {/* Course Link */}
        {request.course && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{request.course.code}</Badge>
            <span className="text-muted-foreground">{request.course.title}</span>
          </div>
        )}

        {/* Training Provider */}
        {request.training_provider && (
          <div className="text-sm">
            <span className="font-medium">Provider: </span>
            <span className="text-muted-foreground">{request.training_provider}</span>
          </div>
        )}

        {/* Training Date & Cost */}
        <div className="flex items-center gap-4 text-sm">
          {request.training_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(request.training_date), 'MMM dd, yyyy')}</span>
            </div>
          )}
          {request.estimated_cost && request.estimated_cost > 0 && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>${request.estimated_cost.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Approval Info */}
        {request.approved_by_employee && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">
              {request.status === 'approved' ? 'Approved' : 'Reviewed'} by: 
            </span>
            <span className="ml-1">{request.approved_by_employee.name}</span>
            {request.approval_date && (
              <span className="ml-1">
                on {format(new Date(request.approval_date), 'MMM dd, yyyy')}
              </span>
            )}
          </div>
        )}

        {/* Approval Comment */}
        {request.approval_comment && (
          <div className="bg-muted p-3 rounded-md text-sm">
            <span className="font-medium">Comment: </span>
            <span>{request.approval_comment}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(request)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>

          {canSubmitForApproval && (
            <Button
              size="sm"
              onClick={() => onSubmitForApproval?.(request.id)}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
          )}

          {showApprovalActions && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onApprove?.(request.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject?.(request.id)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}