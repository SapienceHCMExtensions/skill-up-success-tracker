import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  TrendingUp
} from "lucide-react"

export default function Scorecards() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("all")

  // Mock employee scorecard data
  const employeeScoreCards = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      department: "Engineering",
      position: "Senior Developer",
      assignedCourses: 8,
      completedCourses: 6,
      inProgressCourses: 1,
      overdueCourses: 1,
      averageScore: 87,
      certificatesExpiring: 2,
      totalCertificates: 5,
      recentActivity: "Completed Cybersecurity Awareness - 2 days ago"
    },
    {
      id: 2,
      name: "Mike Chen",
      email: "mike.chen@company.com",
      department: "Marketing",
      position: "Marketing Manager",
      assignedCourses: 6,
      completedCourses: 6,
      inProgressCourses: 0,
      overdueCourses: 0,
      averageScore: 94,
      certificatesExpiring: 0,
      totalCertificates: 4,
      recentActivity: "Completed Leadership Fundamentals - 1 week ago"
    },
    {
      id: 3,
      name: "Lisa Davis",
      email: "lisa.davis@company.com",
      department: "Operations",
      position: "Operations Specialist",
      assignedCourses: 5,
      completedCourses: 3,
      inProgressCourses: 2,
      overdueCourses: 0,
      averageScore: 91,
      certificatesExpiring: 1,
      totalCertificates: 3,
      recentActivity: "Started Project Management Basics - 3 days ago"
    },
    {
      id: 4,
      name: "James Wilson",
      email: "james.wilson@company.com",
      department: "Engineering",
      position: "DevOps Engineer",
      assignedCourses: 10,
      completedCourses: 7,
      inProgressCourses: 2,
      overdueCourses: 1,
      averageScore: 89,
      certificatesExpiring: 3,
      totalCertificates: 6,
      recentActivity: "Completed Data Protection Training - 5 days ago"
    },
    {
      id: 5,
      name: "Emily Rodriguez",
      email: "emily.rodriguez@company.com",
      department: "HR",
      position: "HR Business Partner",
      assignedCourses: 7,
      completedCourses: 5,
      inProgressCourses: 1,
      overdueCourses: 1,
      averageScore: 92,
      certificatesExpiring: 1,
      totalCertificates: 4,
      recentActivity: "In Progress: Diversity & Inclusion Workshop"
    }
  ]

  const filteredEmployees = employeeScoreCards.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDepartment = filterDepartment === "all" || employee.department === filterDepartment
    
    return matchesSearch && matchesDepartment
  })

  const calculateCompletionRate = (completed: number, assigned: number) => {
    return assigned > 0 ? Math.round((completed / assigned) * 100) : 0
  }

  const getStatusBadge = (employee: any) => {
    if (employee.overdueCourses > 0) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    if (employee.inProgressCourses > 0) {
      return <Badge className="bg-course-progress text-white">In Progress</Badge>
    }
    if (employee.completedCourses === employee.assignedCourses) {
      return <Badge className="bg-course-completed text-white">Complete</Badge>
    }
    return <Badge variant="secondary">Active</Badge>
  }

  const departments = ["Engineering", "Marketing", "Operations", "HR"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Scorecards</h1>
          <p className="text-muted-foreground mt-1">Track training status and results for each employee</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-primary-hover shadow-primary">
          <TrendingUp className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search employees by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Scorecards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="shadow-card hover:shadow-hover transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{employee.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {employee.position} • {employee.department}
                  </CardDescription>
                  <div className="text-xs text-muted-foreground mt-1">
                    {employee.email}
                  </div>
                </div>
                {getStatusBadge(employee)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Training Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Training Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {employee.completedCourses}/{employee.assignedCourses} courses
                  </span>
                </div>
                <Progress value={calculateCompletionRate(employee.completedCourses, employee.assignedCourses)} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {calculateCompletionRate(employee.completedCourses, employee.assignedCourses)}% complete
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <div className="text-xl font-bold text-primary">{employee.averageScore}%</div>
                  <div className="text-xs text-muted-foreground">Avg Score</div>
                </div>
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <div className="text-xl font-bold">
                    {employee.totalCertificates - employee.certificatesExpiring}/{employee.totalCertificates}
                  </div>
                  <div className="text-xs text-muted-foreground">Valid Certs</div>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="space-y-2">
                {employee.inProgressCourses > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-warning-light rounded text-sm">
                    <Clock className="w-4 h-4 text-warning" />
                    <span>{employee.inProgressCourses} course(s) in progress</span>
                  </div>
                )}
                
                {employee.overdueCourses > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded text-sm">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">{employee.overdueCourses} overdue course(s)</span>
                  </div>
                )}
                
                {employee.certificatesExpiring > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-warning-light rounded text-sm">
                    <Award className="w-4 h-4 text-warning" />
                    <span>{employee.certificatesExpiring} certificate(s) expiring soon</span>
                  </div>
                )}
                
                {employee.overdueCourses === 0 && employee.certificatesExpiring === 0 && employee.inProgressCourses === 0 && (
                  <div className="flex items-center gap-2 p-2 bg-success-light rounded text-sm">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-success">All training requirements up to date</span>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">Recent Activity</div>
                <div className="text-sm">{employee.recentActivity}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button size="sm" className="flex-1">
                  Assign Training
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{filteredEmployees.length}</div>
            <div className="text-xs text-muted-foreground">Total Employees</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-success">
              {Math.round(filteredEmployees.reduce((sum, emp) => sum + calculateCompletionRate(emp.completedCourses, emp.assignedCourses), 0) / filteredEmployees.length)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Completion</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-warning">
              {filteredEmployees.filter(emp => emp.overdueCourses > 0).length}
            </div>
            <div className="text-xs text-muted-foreground">With Overdue</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <Award className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {filteredEmployees.reduce((sum, emp) => sum + emp.certificatesExpiring, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Certs Expiring</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}