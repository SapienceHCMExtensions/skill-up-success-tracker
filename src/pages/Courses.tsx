import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Toggle } from "@/components/ui/toggle"
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Clock,
  DollarSign,
  Award,
  Users,
  Edit,
  UserPlus,
  Eye,
  Trash2,
  Grid3X3,
  List
} from "lucide-react"
import { useCourses } from "@/hooks/useCourses"
import { CourseDialog } from "@/components/courses/CourseDialog"
import { AssignTrainingDialog } from "@/components/courses/AssignTrainingDialog"
import { CourseViewDialog } from "@/components/courses/CourseViewDialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterProvider, setFilterProvider] = useState("all")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const { courses, loading, deleteCourse } = useCourses()

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (course.competencies && course.competencies.some(comp => comp.toLowerCase().includes(searchQuery.toLowerCase())))
    
    const matchesProvider = filterProvider === "all" || course.provider_type === filterProvider
    
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
        <CourseDialog
          trigger={
            <Button className="bg-gradient-primary hover:bg-primary-hover shadow-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add New Course
            </Button>
          }
        />
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
            <div className="flex gap-1 border rounded-lg p-1">
              <Toggle
                pressed={viewMode === "cards"}
                onPressedChange={() => setViewMode("cards")}
                size="sm"
                aria-label="Card view"
              >
                <Grid3X3 className="w-4 h-4" />
              </Toggle>
              <Toggle
                pressed={viewMode === "table"}
                onPressedChange={() => setViewMode("table")}
                size="sm"
                aria-label="Table view"
              >
                <List className="w-4 h-4" />
              </Toggle>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Course Content */}
      {!loading && viewMode === "cards" && (
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
                    {getProviderBadge(course.provider_type)}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                </div>
                <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {course.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Competencies */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">COMPETENCIES</div>
                <div className="flex flex-wrap gap-1">
                  {course.competencies && course.competencies.length > 0 ? (
                    course.competencies.map((comp, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {comp}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No competencies defined</span>
                  )}
                </div>
              </div>

              {/* Course Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{course.duration_hours}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>${course.default_cost || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span>{course.certificate_validity_months || 0}mo cert</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>0 enrolled</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 pt-2">
                <CourseViewDialog
                  course={course}
                  trigger={
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  }
                />
                <CourseDialog
                  course={course}
                  trigger={
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  }
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Course</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{course.title}"? This will deactivate the course and it won't be available for new enrollments.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteCourse(course.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AssignTrainingDialog
                  course={course}
                  trigger={
                    <Button size="sm" className="flex-1 bg-gradient-primary hover:bg-primary-hover">
                      <UserPlus className="w-3 h-3 mr-1" />
                      Assign
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Course Table */}
      {!loading && viewMode === "table" && (
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Cert Validity</TableHead>
                  <TableHead>Competencies</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{course.code}</TableCell>
                    <TableCell className="max-w-xs">
                      <div>
                        <div className="font-medium">{course.title}</div>
                        {course.description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {course.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getProviderBadge(course.provider_type)}
                    </TableCell>
                    <TableCell>{course.duration_hours}h</TableCell>
                    <TableCell>${course.default_cost || 0}</TableCell>
                    <TableCell>{course.certificate_validity_months || 0}mo</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {course.competencies && course.competencies.length > 0 ? (
                          course.competencies.slice(0, 2).map((comp, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {comp}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                        {course.competencies && course.competencies.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{course.competencies.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <CourseViewDialog
                          course={course}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <CourseDialog
                          course={course}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Course</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{course.title}"? This will deactivate the course and it won't be available for new enrollments.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteCourse(course.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AssignTrainingDialog
                          course={course}
                          trigger={
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!loading && filteredCourses.length === 0 && (
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