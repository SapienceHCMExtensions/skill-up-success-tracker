import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Plus, Users, Clock, DollarSign, Eye, Settings, TrendingUp, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { usePlans } from "@/hooks/usePlans"
import { PlanDialog } from "@/components/plans/PlanDialog"
import { PlanDetailsDialog } from "@/components/plans/PlanDetailsDialog"
import { ModernPlanCalendar } from "@/components/plans/ModernPlanCalendar"
import { supabase } from "@/integrations/supabase/client"

type SortField = 'name' | 'department' | 'year' | 'budget' | 'assigned' | 'status';
type SortDirection = 'asc' | 'desc';

export default function Plans() {
  const { plans, loading, deletePlan } = usePlans();
  const [showCalendar, setShowCalendar] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Debug: Log user role and plans data
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        console.log('Current user role:', roleData?.role);
        console.log('Plans loaded:', plans.length);
      }
    };
    checkUserRole();
  }, [plans]);

  const getStatusBadge = (plan: any) => {
    // Simple status logic based on current date and sessions
    const currentDate = new Date();
    if (plan.sessions && plan.sessions.length > 0) {
      const hasActiveSessions = plan.sessions.some((session: any) => 
        new Date(session.start_date) <= currentDate && 
        new Date(session.end_date) >= currentDate
      );
      const allCompleted = plan.sessions.every((session: any) => 
        new Date(session.end_date) < currentDate
      );
      
      if (allCompleted) {
        return <Badge className="bg-course-completed text-white">Completed</Badge>;
      } else if (hasActiveSessions) {
        return <Badge className="bg-course-progress text-white">Active</Badge>;
      }
    }
    return <Badge variant="secondary">Scheduled</Badge>;
  }

  const handleDeletePlan = async (planId: string) => {
    if (confirm('Are you sure you want to delete this training plan?')) {
      await deletePlan(planId);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusText = (plan: any) => {
    const currentDate = new Date();
    if (plan.sessions && plan.sessions.length > 0) {
      const hasActiveSessions = plan.sessions.some((session: any) => 
        new Date(session.start_date) <= currentDate && 
        new Date(session.end_date) >= currentDate
      );
      const allCompleted = plan.sessions.every((session: any) => 
        new Date(session.end_date) < currentDate
      );
      
      if (allCompleted) return 'Completed';
      if (hasActiveSessions) return 'Active';
    }
    return 'Scheduled';
  };

  const sortedPlans = [...plans].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'department':
        aValue = a.department?.name?.toLowerCase() || 'all departments';
        bValue = b.department?.name?.toLowerCase() || 'all departments';
        break;
      case 'year':
        aValue = a.year || 0;
        bValue = b.year || 0;
        break;
      case 'budget':
        aValue = a.actual_cost || a.estimated_cost || 0;
        bValue = b.actual_cost || b.estimated_cost || 0;
        break;
      case 'assigned':
        aValue = a.plan_employees?.length || 0;
        bValue = b.plan_employees?.length || 0;
        break;
      case 'status':
        aValue = getStatusText(a);
        bValue = getStatusText(b);
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableTableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col">
          <ChevronUp 
            className={`w-3 h-3 ${sortField === field && sortDirection === 'asc' ? 'text-primary' : 'text-muted-foreground/50'}`} 
          />
          <ChevronDown 
            className={`w-3 h-3 -mt-1 ${sortField === field && sortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground/50'}`} 
          />
        </div>
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Plans & Calendar</h1>
          <p className="text-muted-foreground mt-1">Plan and schedule training activities for individuals and groups</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCalendar(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
          </Button>
          <PlanDialog
            trigger={
              <Button className="bg-gradient-primary hover:bg-primary-hover shadow-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            }
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Training Plans Table */}
      {!loading && plans.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Training Plans</CardTitle>
            <CardDescription>Manage and track your training plans</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead field="name">Plan Name</SortableTableHead>
                  <SortableTableHead field="department">Department</SortableTableHead>
                  <SortableTableHead field="year">Period</SortableTableHead>
                  <SortableTableHead field="budget">Budget</SortableTableHead>
                  <SortableTableHead field="assigned">Assigned</SortableTableHead>
                  <SortableTableHead field="status">Status</SortableTableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.department?.name || 'All Departments'}</TableCell>
                    <TableCell>
                      {plan.year} {plan.quarter && `Q${plan.quarter}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatCurrency(plan.actual_cost || plan.estimated_cost || 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {plan.actual_cost ? 'Actual' : 'Estimated'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{plan.plan_employees?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(plan)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PlanDetailsDialog
                          plan={plan}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <PlanDialog
                          plan={plan}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Plans State */}
      {!loading && plans.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No training plans yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first training plan to get started
            </p>
            <PlanDialog
              trigger={
                <Button className="bg-gradient-primary hover:bg-primary-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Plan
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {!loading && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {plans.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Training plans created
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {plans.reduce((sum, plan) => sum + (plan.plan_employees?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Employee assignments across all plans
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ${plans.reduce((sum, plan) => sum + (plan.actual_cost || plan.estimated_cost || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Combined training budget
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar Modal */}
      <ModernPlanCalendar isOpen={showCalendar} onClose={() => setShowCalendar(false)} />
    </div>
  )
}