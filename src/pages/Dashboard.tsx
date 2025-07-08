import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react"
import { SessionDialog } from "@/components/training/SessionDialog"
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

type SessionWithDetails = Tables<'sessions'> & {
  courses?: Partial<Tables<'courses'>>;
  employees?: Partial<Tables<'employees'>>;
  session_enrollments?: Tables<'session_enrollments'>[];
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeCourses: 0,
    upcomingSessions: 0,
    completionRate: 0,
    expiringCertificates: 0,
    completedThisMonth: 0,
    inProgress: 0,
    totalBudget: 0,
    spentBudget: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState<SessionWithDetails[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch upcoming sessions
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select(`
          *,
          courses (title, code),
          employees:instructor_id (name),
          session_enrollments (*)
        `)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5);

      // Fetch counts for dashboard stats
      const [
        { count: employeeCount },
        { count: courseCount },
        { count: sessionCount },
        { count: expiringCount }
      ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('sessions').select('*', { count: 'exact', head: true }).gte('start_date', new Date().toISOString()),
        supabase.from('employee_certificates').select('*', { count: 'exact', head: true }).lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Fetch enrollment stats
      const { data: enrollmentStats } = await supabase
        .from('session_enrollments')
        .select('status, created_at')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const completedThisMonth = enrollmentStats?.filter(e => e.status === 'completed').length || 0;
      const inProgress = enrollmentStats?.filter(e => e.status === 'in_progress').length || 0;
      const totalEnrollments = enrollmentStats?.length || 0;
      const completionRate = totalEnrollments > 0 ? Math.round((completedThisMonth / totalEnrollments) * 100) : 0;

      setStats({
        totalEmployees: employeeCount || 0,
        activeCourses: courseCount || 0,
        upcomingSessions: sessionCount || 0,
        completionRate,
        expiringCertificates: expiringCount || 0,
        completedThisMonth,
        inProgress,
        totalBudget: 125000, // These could come from plans table
        spentBudget: 89500
      });

      setUpcomingSessions(sessionsData as any || []);

      // Mock recent activity for now - could be enhanced with real data
      setRecentActivity([
        { id: 1, type: "completion", employee: "Recent Activity", course: "Check Sessions page", date: "Live data" },
        { id: 2, type: "enrollment", employee: "Real stats", course: "From database", date: "Updated" },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your training programs and employee progress</p>
        </div>
        <SessionDialog
          trigger={
            <Button className="bg-gradient-primary hover:bg-primary-hover shadow-primary">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Training
            </Button>
          }
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active in training programs
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.expiringCertificates}</div>
            <p className="text-xs text-muted-foreground">
              Certificates expire in 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.spentBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              of ${stats.totalBudget.toLocaleString()} allocated
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Progress */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Training Progress
            </CardTitle>
            <CardDescription>Current month activity summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-success">{stats.completedThisMonth}</span>
                <Badge variant="secondary" className="bg-success-light text-success">+12%</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-sm">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-warning">{stats.inProgress}</span>
                <Badge variant="secondary" className="bg-warning-light text-warning">Active</Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full">
                View Detailed Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest training updates and completions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/30">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {activity.type === "completion" && <CheckCircle className="w-4 h-4 text-success" />}
                    {activity.type === "enrollment" && <BookOpen className="w-4 h-4 text-primary" />}
                    {activity.type === "expiring" && <AlertTriangle className="w-4 h-4 text-warning" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.employee}</div>
                    <div className="text-xs text-muted-foreground">{activity.course}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.date}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Training Sessions
          </CardTitle>
          <CardDescription>Sessions scheduled for the next week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading sessions...</div>
            ) : upcomingSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2" />
                <p>No upcoming sessions scheduled</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigate('/sessions')}
                >
                  View All Sessions
                </Button>
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">{session.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(session.start_date).toLocaleDateString()} at {new Date(session.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {session.employees?.name && ` • Instructor: ${session.employees.name}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.courses?.code} - {session.courses?.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {session.session_enrollments?.length || 0} / {session.max_seats || '∞'}
                      </div>
                      <div className="text-xs text-muted-foreground">Enrolled</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/sessions')}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))
            )}
            {!loading && upcomingSessions.length > 0 && (
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/sessions')}
                >
                  View All Sessions
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}