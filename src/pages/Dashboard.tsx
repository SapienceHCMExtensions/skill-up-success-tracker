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

export default function Dashboard() {
  // Mock data - in real app this would come from your database
  const stats = {
    totalEmployees: 1247,
    activeCourses: 45,
    upcomingSessions: 12,
    completionRate: 87,
    expiringCertificates: 23,
    completedThisMonth: 156,
    inProgress: 89,
    totalBudget: 125000,
    spentBudget: 89500
  }

  const recentActivity = [
    { id: 1, type: "completion", employee: "Sarah Johnson", course: "Safety Training 101", date: "2 hours ago" },
    { id: 2, type: "enrollment", employee: "Mike Chen", course: "Leadership Fundamentals", date: "4 hours ago" },
    { id: 3, type: "expiring", employee: "Lisa Davis", course: "First Aid Certification", date: "1 day ago" },
    { id: 4, type: "completion", employee: "James Wilson", course: "Data Protection Training", date: "2 days ago" },
  ]

  const upcomingSessions = [
    { id: 1, course: "Advanced Excel Training", date: "Dec 15, 2024", time: "9:00 AM", instructor: "John Smith", enrolled: 15, capacity: 20 },
    { id: 2, course: "Project Management Basics", date: "Dec 18, 2024", time: "2:00 PM", instructor: "Maria Garcia", enrolled: 12, capacity: 15 },
    { id: 3, course: "Cybersecurity Awareness", date: "Dec 20, 2024", time: "10:00 AM", instructor: "David Lee", enrolled: 25, capacity: 30 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your training programs and employee progress</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-primary-hover shadow-primary">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Training
        </Button>
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
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium">{session.course}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {session.date} at {session.time} • Instructor: {session.instructor}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium">{session.enrolled}/{session.capacity}</div>
                    <div className="text-xs text-muted-foreground">Enrolled</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}