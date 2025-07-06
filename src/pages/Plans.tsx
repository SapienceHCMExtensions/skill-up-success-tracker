import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Users, Clock, DollarSign } from "lucide-react"

export default function Plans() {
  // Mock training plans data
  const trainingPlans = [
    {
      id: 1,
      title: "Q1 2024 Safety Training Initiative",
      department: "All Departments",
      quarter: "Q1 2024",
      status: "active",
      enrolledEmployees: 245,
      totalEmployees: 280,
      estimatedCost: 15750,
      actualCost: 14200,
      sessions: [
        { course: "Workplace Safety Fundamentals", date: "2024-01-15", enrolled: 45 },
        { course: "Emergency Response Training", date: "2024-02-20", enrolled: 38 },
        { course: "Equipment Safety Protocols", date: "2024-03-10", enrolled: 52 }
      ]
    },
    {
      id: 2,
      title: "Leadership Development Program 2024",
      department: "Management",
      quarter: "Q2 2024",
      status: "planning",
      enrolledEmployees: 25,
      totalEmployees: 30,
      estimatedCost: 21250,
      actualCost: 0,
      sessions: [
        { course: "Strategic Leadership", date: "2024-04-10", enrolled: 15 },
        { course: "Team Management Excellence", date: "2024-05-15", enrolled: 20 },
        { course: "Communication Mastery", date: "2024-06-20", enrolled: 12 }
      ]
    },
    {
      id: 3,
      title: "IT Security Compliance Training",
      department: "Technology",
      quarter: "Q1 2024",
      status: "completed",
      enrolledEmployees: 89,
      totalEmployees: 89,
      estimatedCost: 6675,
      actualCost: 7100,
      sessions: [
        { course: "Cybersecurity Awareness", date: "2024-01-25", enrolled: 89 },
        { course: "Data Protection Protocols", date: "2024-02-28", enrolled: 89 }
      ]
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-course-progress text-white">Active</Badge>
      case "completed":
        return <Badge className="bg-course-completed text-white">Completed</Badge>
      case "planning":
        return <Badge variant="secondary">Planning</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calculateCompletionRate = (enrolled: number, total: number) => {
    return Math.round((enrolled / total) * 100)
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
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
          </Button>
          <Button className="bg-gradient-primary hover:bg-primary-hover shadow-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Training Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trainingPlans.map((plan) => (
          <Card key={plan.id} className="shadow-card hover:shadow-hover transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{plan.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {plan.department}
                    </span>
                    <span>{plan.quarter}</span>
                  </CardDescription>
                </div>
                {getStatusBadge(plan.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {calculateCompletionRate(plan.enrolledEmployees, plan.totalEmployees)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Completion Rate</div>
                </div>
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <div className="text-2xl font-bold">
                    {plan.enrolledEmployees}/{plan.totalEmployees}
                  </div>
                  <div className="text-xs text-muted-foreground">Enrolled</div>
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
                    ${plan.actualCost > 0 ? plan.actualCost.toLocaleString() : plan.estimatedCost.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {plan.actualCost > 0 ? 'Actual' : 'Estimated'}
                  </div>
                  {plan.actualCost > 0 && (
                    <div className={`text-xs ${plan.actualCost > plan.estimatedCost ? 'text-destructive' : 'text-success'}`}>
                      {plan.actualCost > plan.estimatedCost ? '+' : '-'}
                      ${Math.abs(plan.actualCost - plan.estimatedCost).toLocaleString()} variance
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
                  {plan.sessions.slice(0, 2).map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-accent/20 rounded text-sm">
                      <div>
                        <div className="font-medium">{session.course}</div>
                        <div className="text-xs text-muted-foreground">{session.date}</div>
                      </div>
                      <div className="text-xs">
                        {session.enrolled} enrolled
                      </div>
                    </div>
                  ))}
                  {plan.sessions.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{plan.sessions.length - 2} more sessions
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button size="sm" className="flex-1">
                  Manage Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {trainingPlans.filter(p => p.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently running training plans
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {trainingPlans.reduce((sum, plan) => sum + plan.enrolledEmployees, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Employees across all plans
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {Math.round((trainingPlans.reduce((sum, plan) => sum + (plan.actualCost || plan.estimatedCost), 0) / trainingPlans.reduce((sum, plan) => sum + plan.estimatedCost, 0)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Of allocated training budget
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}