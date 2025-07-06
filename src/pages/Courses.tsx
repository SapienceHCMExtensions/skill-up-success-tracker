import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Clock,
  DollarSign,
  Award,
  Users
} from "lucide-react"

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterProvider, setFilterProvider] = useState("all")

  // Mock course data
  const courses = [
    {
      id: 1,
      code: "SF-101",
      title: "Workplace Safety Fundamentals",
      description: "Essential safety protocols and emergency procedures for all employees.",
      provider: "internal",
      competencies: ["Safety", "Emergency Response", "Risk Assessment"],
      duration: 8,
      cost: 150,
      certificateValidity: 24,
      enrolledCount: 245
    },
    {
      id: 2,
      code: "LD-201",
      title: "Leadership Development Program",
      description: "Comprehensive leadership skills training for managers and supervisors.",
      provider: "external",
      competencies: ["Leadership", "Communication", "Team Management"],
      duration: 24,
      cost: 850,
      certificateValidity: 36,
      enrolledCount: 67
    },
    {
      id: 3,
      code: "IT-301",
      title: "Cybersecurity Awareness",
      description: "Essential cybersecurity training covering threats, best practices, and compliance.",
      provider: "internal",
      competencies: ["Cybersecurity", "Data Protection", "Compliance"],
      duration: 4,
      cost: 75,
      certificateValidity: 12,
      enrolledCount: 892
    },
    {
      id: 4,
      code: "HR-401",
      title: "Diversity & Inclusion Workshop",
      description: "Building inclusive workplace culture and understanding unconscious bias.",
      provider: "external",
      competencies: ["Diversity", "Inclusion", "Cultural Awareness"],
      duration: 6,
      cost: 200,
      certificateValidity: 24,
      enrolledCount: 156
    },
    {
      id: 5,
      code: "PM-501",
      title: "Project Management Essentials",
      description: "Fundamental project management methodologies and tools.",
      provider: "internal",
      competencies: ["Project Management", "Planning", "Execution"],
      duration: 16,
      cost: 450,
      certificateValidity: 36,
      enrolledCount: 89
    },
    {
      id: 6,
      code: "CS-601",
      title: "Customer Service Excellence",
      description: "Advanced techniques for delivering exceptional customer experiences.",
      provider: "external",
      competencies: ["Customer Service", "Communication", "Problem Solving"],
      duration: 12,
      cost: 300,
      certificateValidity: 24,
      enrolledCount: 234
    }
  ]

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.competencies.some(comp => comp.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesProvider = filterProvider === "all" || course.provider === filterProvider
    
    return matchesSearch && matchesProvider
  })

  const getProviderBadge = (provider: string) => {
    return provider === "internal" 
      ? <Badge variant="secondary" className="bg-primary/10 text-primary">Internal</Badge>
      : <Badge variant="secondary" className="bg-accent/50 text-accent-foreground">External</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Course Catalog</h1>
          <p className="text-muted-foreground mt-1">Manage and organize all available training courses</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-primary-hover shadow-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add New Course
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search courses, codes, or competencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="shadow-card hover:shadow-hover transition-all cursor-pointer group">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {course.code}
                    </Badge>
                    {getProviderBadge(course.provider)}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                </div>
                <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {course.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Competencies */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">COMPETENCIES</div>
                <div className="flex flex-wrap gap-1">
                  {course.competencies.map((comp, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Course Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{course.duration}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>${course.cost}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span>{course.certificateValidity}mo cert</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{course.enrolledCount} enrolled</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit Course
                </Button>
                <Button size="sm" className="flex-1 bg-gradient-primary hover:bg-primary-hover">
                  Assign Training
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredCourses.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button variant="outline">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}