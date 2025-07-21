import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Users, Clock, DollarSign, Eye, Settings, TrendingUp, Edit, Trash2 } from "lucide-react"
import { usePlans } from "@/hooks/usePlans"
import { PlanDialog } from "@/components/plans/PlanDialog"
import { PlanDetailsDialog } from "@/components/plans/PlanDetailsDialog"
import { PlanCalendar } from "@/components/plans/PlanCalendar"
import ContributorsTable from "@/components/ui/ruixen-contributors-table"
import { supabase } from "@/integrations/supabase/client"

export default function Plans() {
  const { plans, loading, deletePlan } = usePlans();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedPlanForView, setSelectedPlanForView] = useState<any>(null);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<any>(null);

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

  const getStatusText = (plan: any): "Active" | "Inactive" | "In Progress" | "Completed" | "Scheduled" => {
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
        return "Completed";
      } else if (hasActiveSessions) {
        return "Active";
      }
    }
    return "Scheduled";
  };

  // Transform plans data for ContributorsTable
  const transformedPlansData = plans.map((plan) => ({
    id: plan.id,
    title: plan.name,
    repo: plan.description || "No description",
    status: getStatusText(plan),
    team: plan.department?.name || 'All Departments',
    tech: `${plan.year} ${plan.quarter ? `Q${plan.quarter}` : ''}`,
    createdAt: new Date(plan.created_at).toISOString().split('T')[0],
    contributors: plan.plan_employees?.map((pe: any, index: number) => ({
      name: pe.employee?.name || `Employee ${index + 1}`,
      email: pe.employee?.email || `employee${index + 1}@company.com`,
      avatar: `https://images.unsplash.com/photo-${507003211 + index}-f8f872a30a0c?w=40&h=40&fit=crop&crop=face`,
      role: pe.required ? 'Required' : 'Optional',
    })) || [],
  }));

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

  // Action handlers for the table
  const handleViewPlan = (project: any) => {
    const originalPlan = plans.find(p => p.id === project.id);
    if (originalPlan) {
      setSelectedPlanForView(originalPlan);
    }
  };

  const handleEditPlan = (project: any) => {
    const originalPlan = plans.find(p => p.id === project.id);
    if (originalPlan) {
      setSelectedPlanForEdit(originalPlan);
    }
  };

  const handleDeletePlan = async (project: any) => {
    if (confirm('Are you sure you want to delete this training plan?')) {
      await deletePlan(project.id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
        <div>
          <ContributorsTable 
            data={transformedPlansData}
            actions={{
              onView: handleViewPlan,
              onEdit: handleEditPlan,
              onDelete: handleDeletePlan,
            }}
          />
        </div>
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
      <PlanCalendar isOpen={showCalendar} onClose={() => setShowCalendar(false)} />
      
      {/* Plan Details Dialog */}
      {selectedPlanForView && (
        <PlanDetailsDialog
          plan={selectedPlanForView}
          trigger={
            <Button 
              style={{ display: 'none' }} 
              onClick={() => setSelectedPlanForView(null)}
            />
          }
        />
      )}
      
      {/* Plan Edit Dialog */}
      {selectedPlanForEdit && (
        <PlanDialog
          plan={selectedPlanForEdit}
          trigger={
            <Button 
              style={{ display: 'none' }} 
              onClick={() => setSelectedPlanForEdit(null)}
            />
          }
        />
      )}
    </div>
  )
}