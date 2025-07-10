import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, FileText, Clock, CheckCircle } from 'lucide-react';
import { TrainingRequestDialog } from '@/components/training-requests/TrainingRequestDialog';
import { TrainingRequestCard } from '@/components/training-requests/TrainingRequestCard';
import { useTrainingRequests } from '@/hooks/useTrainingRequests';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TrainingRequests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  const { requests, loading, refetch, updateRequestStatus, submitForApproval } = useTrainingRequests();
  const { toast } = useToast();

  // Get current user and roles
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        setCurrentUser(employee);
        setUserRoles(roles?.map(r => r.role) || []);
      }
    };
    getCurrentUser();
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.training_provider?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && request.status === statusFilter;
  });

  const getRequestCounts = () => {
    return {
      all: requests.length,
      draft: requests.filter(r => r.status === 'draft').length,
      pending: requests.filter(r => r.status === 'pending_approval').length,
      approved: requests.filter(r => r.status === 'approved').length,
      completed: requests.filter(r => r.status === 'completed').length,
    };
  };

  const handleApprove = async (requestId: string) => {
    const comment = prompt('Add approval comment (optional):');
    await updateRequestStatus(requestId, 'approved', comment || undefined);
  };

  const handleReject = async (requestId: string) => {
    const comment = prompt('Add rejection reason:');
    if (comment) {
      await updateRequestStatus(requestId, 'rejected', comment);
    }
  };

  const handleSubmitForApproval = async (requestId: string) => {
    await submitForApproval(requestId);
  };

  const handleViewDetails = (request: any) => {
    // TODO: Implement detailed view dialog
    toast({
      title: "Details",
      description: "Detailed view coming soon!",
    });
  };

  const counts = getRequestCounts();
  const isManager = userRoles.includes('manager') || userRoles.includes('admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage training requests and approvals
          </p>
        </div>
        <TrainingRequestDialog
          trigger={
            <Button className="bg-gradient-primary hover:bg-primary-hover">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          }
          employeeId={currentUser?.id}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{counts.all}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold">{counts.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{counts.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{counts.completed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">Loading training requests...</div>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No requests match your filters' 
                  : 'No training requests found'}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <TrainingRequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
                onSubmitForApproval={handleSubmitForApproval}
                onViewDetails={handleViewDetails}
                currentUserRole={isManager ? 'manager' : 'employee'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}