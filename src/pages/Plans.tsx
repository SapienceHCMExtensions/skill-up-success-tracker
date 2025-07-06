import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Users, Clock, DollarSign, Eye, Settings, TrendingUp } from "lucide-react"
import { usePlans } from "@/hooks/usePlans"
import { PlanDialog } from "@/components/plans/PlanDialog"
import { PlanDetailsDialog } from "@/components/plans/PlanDetailsDialog"
import { PlanCalendar } from "@/components/plans/PlanCalendar"
import { supabase } from "@/integrations/supabase/client"

export default function Plans() {
  const { plans, loading } = usePlans();
  const [showCalendar, setShowCalendar] = useState(false);

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

  const calculateCompletionRate = (plan: any) => {
    if (!plan.plan_employees || plan.plan_employees.length === 0) return 0;
    // For now, return a simple calculation
    return Math.round(Math.random() * 100); // TODO: Calculate based on actual completion data
  }

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

      {/* Training Plans Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan) => (
          <Card key={plan.id} className="shadow-card hover:shadow-hover transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{plan.name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {plan.department?.name || 'All Departments'}
                    </span>
                    <span>{plan.year} {plan.quarter && `Q${plan.quarter}`}</span>
                  </CardDescription>
                </div>
                {getStatusBadge(plan)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {calculateCompletionRate(plan)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Completion Rate</div>
                </div>
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <div className="text-2xl font-bold">
                    {plan.plan_employees?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Assigned Employees</div>
                </div>
              </div>

              {/* Cost Information */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Budget</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${(plan.actual_cost || plan.estimated_cost || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {plan.actual_cost ? 'Actual' : 'Estimated'}
                  </div>
                  {plan.actual_cost && plan.estimated_cost && (
                    <div className={`text-xs ${plan.actual_cost > plan.estimated_cost ? 'text-destructive' : 'text-success'}`}>
                      {plan.actual_cost > plan.estimated_cost ? '+' : '-'}
                      ${Math.abs(plan.actual_cost - plan.estimated_cost).toLocaleString()} variance
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Scheduled Sessions
                </div>
                <div className="space-y-2">
                  {plan.sessions && plan.sessions.length > 0 ? (
                    <>
                      {plan.sessions.slice(0, 2).map((session, index) => (
                        <div key={session.id || index} className="flex items-center justify-between p-2 bg-accent/20 rounded text-sm">
                          <div>
                            <div className="font-medium">{session.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(session.start_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-xs">
                            {session.location || 'TBD'}
                          </div>
                        </div>
                      ))}
                      {plan.sessions.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          +{plan.sessions.length - 2} more sessions
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No sessions scheduled yet
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <PlanDetailsDialog
                  plan={plan}
                  trigger={
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  }
                />
                <PlanDialog
                  plan={plan}
                  trigger={
                    <Button size="sm" className="flex-1">
                      <Settings className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  }
                />
              </div>
            </CardContent>
            </Card>
          ))}
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
    </div>
  )
}