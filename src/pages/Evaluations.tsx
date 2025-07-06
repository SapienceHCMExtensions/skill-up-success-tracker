import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Plus, 
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3
} from "lucide-react"

export default function Evaluations() {
  // Mock evaluation data
  const evaluationSummary = {
    totalResponses: 1247,
    averageRating: 4.2,
    responseRate: 87,
    topRatedCourse: "Leadership Development Program",
    lowestRatedCourse: "Compliance Training Basic"
  }

  const courseEvaluations = [
    {
      id: 1,
      courseTitle: "Leadership Development Program",
      instructor: "Maria Garcia",
      totalParticipants: 67,
      responses: 58,
      averageRating: 4.7,
      ratings: {
        content: 4.8,
        instructor: 4.9,
        materials: 4.5,
        overall: 4.7
      },
      comments: [
        "Excellent practical examples and interactive sessions",
        "Very engaging instructor, learned valuable leadership techniques",
        "Great course structure and relevant case studies"
      ],
      completionDate: "2024-03-15"
    },
    {
      id: 2,
      courseTitle: "Cybersecurity Awareness",
      instructor: "David Lee",
      totalParticipants: 892,
      responses: 756,
      averageRating: 4.1,
      ratings: {
        content: 4.2,
        instructor: 4.0,
        materials: 4.1,
        overall: 4.1
      },
      comments: [
        "Good information but could be more interactive",
        "Covered all essential security topics well",
        "Examples were helpful but presentation was dry"
      ],
      completionDate: "2024-02-28"
    },
    {
      id: 3,
      courseTitle: "Project Management Essentials",
      instructor: "John Smith",
      totalParticipants: 89,
      responses: 82,
      averageRating: 4.4,
      ratings: {
        content: 4.5,
        instructor: 4.6,
        materials: 4.2,
        overall: 4.4
      },
      comments: [
        "Very practical approach to project management",
        "Instructor was knowledgeable and helpful",
        "Good balance of theory and practice"
      ],
      completionDate: "2024-03-20"
    },
    {
      id: 4,
      courseTitle: "Customer Service Excellence",
      instructor: "Lisa Chen",
      totalParticipants: 234,
      responses: 198,
      averageRating: 3.9,
      ratings: {
        content: 4.0,
        instructor: 3.8,
        materials: 3.9,
        overall: 3.9
      },
      comments: [
        "Content was relevant but presentation needs improvement",
        "Good customer scenarios but instructor seemed rushed",
        "Useful tips but could use more role-playing exercises"
      ],
      completionDate: "2024-02-15"
    }
  ]

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm font-medium ml-2">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const getResponseRate = (responses: number, total: number) => {
    return Math.round((responses / total) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Evaluations</h1>
          <p className="text-muted-foreground mt-1">Collect and analyze feedback on training effectiveness</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
          <Button className="bg-gradient-primary hover:bg-primary-hover shadow-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Evaluation
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluationSummary.totalResponses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all training programs
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluationSummary.averageRating}/5.0</div>
            <p className="text-xs text-muted-foreground">
              Overall satisfaction score
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{evaluationSummary.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              Employee participation
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Rated Course</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{evaluationSummary.topRatedCourse}</div>
            <p className="text-xs text-muted-foreground">
              Highest satisfaction rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Evaluations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courseEvaluations.map((evaluation) => (
          <Card key={evaluation.id} className="shadow-card hover:shadow-hover transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{evaluation.courseTitle}</CardTitle>
                  <CardDescription>
                    Instructor: {evaluation.instructor} • Completed: {evaluation.completionDate}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {evaluation.responses}/{evaluation.totalParticipants} responses
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Overall Rating */}
              <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Overall Rating</div>
                  {renderStars(evaluation.averageRating)}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{evaluation.averageRating}</div>
                  <div className="text-xs text-muted-foreground">out of 5.0</div>
                </div>
              </div>

              {/* Response Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Response Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {getResponseRate(evaluation.responses, evaluation.totalParticipants)}%
                  </span>
                </div>
                <Progress value={getResponseRate(evaluation.responses, evaluation.totalParticipants)} className="h-2" />
              </div>

              {/* Detailed Ratings */}
              <div className="space-y-2">
                <div className="text-sm font-medium mb-2">Detailed Ratings</div>
                {Object.entries(evaluation.ratings).map(([category, rating]) => (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{category}:</span>
                    <div className="flex items-center gap-2">
                      {renderStars(rating)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Comments */}
              <div>
                <div className="text-sm font-medium mb-2">Recent Comments</div>
                <div className="space-y-2">
                  {evaluation.comments.slice(0, 2).map((comment, index) => (
                    <div key={index} className="p-2 bg-muted/50 rounded text-xs italic">
                      "{comment}"
                    </div>
                  ))}
                  {evaluation.comments.length > 2 && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      View all {evaluation.comments.length} comments
                    </Button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Full Report
                </Button>
                <Button size="sm" className="flex-1">
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Insights */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Performance Insights
          </CardTitle>
          <CardDescription>Key findings from recent evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-success-light rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-success" />
                <span className="font-medium text-success">Highest Rated</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">{evaluationSummary.topRatedCourse}</div>
                <div className="text-muted-foreground">4.7/5.0 average rating</div>
              </div>
            </div>
            
            <div className="p-4 bg-warning-light rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-warning" />
                <span className="font-medium text-warning">High Participation</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">Cybersecurity Awareness</div>
                <div className="text-muted-foreground">85% response rate</div>
              </div>
            </div>
            
            <div className="p-4 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="font-medium">Needs Attention</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">Customer Service Excellence</div>
                <div className="text-muted-foreground">3.9/5.0 needs improvement</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}