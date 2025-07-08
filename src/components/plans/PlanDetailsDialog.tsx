import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, DollarSign, Clock, BookOpen, TrendingUp, AlertCircle, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AssignEmployeesDialog } from './AssignEmployeesDialog';
import { SessionDialog } from '@/components/training/SessionDialog';
import type { Tables } from '@/integrations/supabase/types';

type Plan = Tables<'plans'> & {
  department?: Tables<'departments'>;
  sessions?: Tables<'sessions'>[];
  plan_employees?: (Tables<'plan_employees'> & {
    employee?: Tables<'employees'>;
  })[];
};

interface PlanDetailsDialogProps {
  plan: Plan;
  trigger: React.ReactNode;
}

export function PlanDetailsDialog({ plan, trigger }: PlanDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<Tables<'sessions'>[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  const fetchPlanDetails = async () => {
    if (!open) return;

    try {
      // Fetch sessions for this plan
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select(`
          *,
          course:courses(*),
          instructor:employees!sessions_instructor_id_fkey(*)
        `)
        .eq('plan_id', plan.id)
        .order('start_date');

      setSessions(sessionsData || []);

      // Fetch enrollments for sessions
      if (sessionsData && sessionsData.length > 0) {
        const sessionIds = sessionsData.map(s => s.id);
        const { data: enrollmentsData } = await supabase
          .from('session_enrollments')
          .select(`
            *,
            employee:employees(*),
            session:sessions(*)
          `)
          .in('session_id', sessionIds);

        setEnrollments(enrollmentsData || []);
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const currentDate = new Date();
    const isActive = sessions.some(session => 
      new Date(session.start_date) <= currentDate && 
      new Date(session.end_date) >= currentDate
    );
    const isCompleted = sessions.every(session => 
      new Date(session.end_date) < currentDate
    );

    if (isCompleted) {
      return <Badge className="bg-course-completed text-white">Completed</Badge>;
    } else if (isActive) {
      return <Badge className="bg-course-progress text-white">Active</Badge>;
    } else {
      return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  const calculateProgress = () => {
    if (sessions.length === 0) return 0;
    const completedSessions = sessions.filter(session => 
      new Date(session.end_date) < new Date()
    ).length;
    return Math.round((completedSessions / sessions.length) * 100);
  };

  const getTotalEnrollments = () => {
    return enrollments.length;
  };

  const getCompletedEnrollments = () => {
    return enrollments.filter(e => e.status === 'completed').length;
  };

  useEffect(() => {
    fetchPlanDetails();
  }, [open, plan.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{plan.name}</DialogTitle>
              <p className="text-muted-foreground mt-1">
                {plan.department?.name || 'All Departments'} • {plan.year} {plan.quarter && `Q${plan.quarter}`}
              </p>
            </div>
            {getStatusBadge('')}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateProgress()}%</div>
                  <Progress value={calculateProgress()} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Enrollments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getTotalEnrollments()}</div>
                  <p className="text-xs text-muted-foreground">
                    {getCompletedEnrollments()} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(plan.actual_cost || plan.estimated_cost || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {plan.actual_cost ? 'Actual' : 'Estimated'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{session.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {enrollments.filter(e => e.session_id === session.id).length} enrolled
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.location || 'TBD'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-8 h-8 mx-auto mb-2" />
                      <p>No sessions scheduled yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Training Sessions</CardTitle>
                  <CardDescription>
                    Manage all training sessions in this plan
                  </CardDescription>
                </div>
                <SessionDialog
                  planId={plan.id}
                  trigger={
                    <Button size="sm" className="bg-gradient-primary hover:bg-primary-hover">
                      <Calendar className="w-4 h-4 mr-2" />
                      Create Session
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{session.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.location || 'Location TBD'}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {enrollments.filter(e => e.session_id === session.id).length} enrolled
                        </div>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-8 h-8 mx-auto mb-2" />
                      <p>No sessions created yet</p>
                      <p className="text-sm">Create your first session to start training</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Assigned Employees</CardTitle>
                  <CardDescription>
                    Employees assigned to this training plan
                  </CardDescription>
                </div>
                <AssignEmployeesDialog
                  plan={plan}
                  onEmployeesAssigned={() => {
                    // Force a refresh by closing and reopening the dialog
                    setOpen(false);
                    setTimeout(() => setOpen(true), 100);
                  }}
                  trigger={
                    <Button size="sm" className="bg-gradient-primary hover:bg-primary-hover">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign Employees
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.plan_employees?.map((planEmployee) => (
                    <div key={planEmployee.employee?.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{planEmployee.employee?.name}</div>
                        <div className="text-sm text-muted-foreground">{planEmployee.employee?.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {planEmployee.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {enrollments.filter(e => e.employee_id === planEmployee.employee?.id).length} sessions
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!plan.plan_employees || plan.plan_employees.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2" />
                      <p>No employees assigned yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {getTotalEnrollments() > 0 ? Math.round((getCompletedEnrollments() / getTotalEnrollments()) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getCompletedEnrollments()} of {getTotalEnrollments()} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Budget Variance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {plan.actual_cost && plan.estimated_cost ? (
                      <>
                        <span className={plan.actual_cost > plan.estimated_cost ? 'text-destructive' : 'text-success'}>
                          {plan.actual_cost > plan.estimated_cost ? '+' : '-'}
                          ${Math.abs(plan.actual_cost - plan.estimated_cost).toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Budget variance
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional analytics could be added here */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.length === 0 && (
                    <div className="flex items-center gap-2 text-warning">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">No sessions scheduled</span>
                    </div>
                  )}
                  {(!plan.plan_employees || plan.plan_employees.length === 0) && (
                    <div className="flex items-center gap-2 text-warning">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">No employees assigned</span>
                    </div>
                  )}
                  {sessions.length > 0 && plan.plan_employees && plan.plan_employees.length > 0 && (
                    <div className="flex items-center gap-2 text-success">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Plan is properly configured</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}