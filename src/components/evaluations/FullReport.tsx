import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FileText, Download, Star, Users, TrendingUp, Calendar } from 'lucide-react';

interface EvaluationResponse {
  id: string;
  overall_rating: number;
  responses: any;
  submitted_at: string;
  employee?: {
    name: string;
    email: string;
  };
  session?: {
    title: string;
    course?: {
      title: string;
    };
  };
}

interface FullReportProps {
  responses: EvaluationResponse[];
  onExport: (format: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function FullReport({ responses, onExport }: FullReportProps) {
  const calculateMetrics = () => {
    if (responses.length === 0) return null;

    const totalResponses = responses.length;
    const averageRating = responses.reduce((sum, r) => sum + r.overall_rating, 0) / totalResponses;
    
    // Rating distribution
    const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
      rating: rating.toString(),
      count: responses.filter(r => r.overall_rating === rating).length,
      percentage: (responses.filter(r => r.overall_rating === rating).length / totalResponses) * 100
    }));

    // Course breakdown
    const courseBreakdown: { [key: string]: { count: number; avgRating: number; ratings: number[] } } = {};
    responses.forEach(response => {
      const courseName = response.session?.course?.title || 'Unknown Course';
      if (!courseBreakdown[courseName]) {
        courseBreakdown[courseName] = { count: 0, avgRating: 0, ratings: [] };
      }
      courseBreakdown[courseName].count += 1;
      courseBreakdown[courseName].ratings.push(response.overall_rating);
    });

    // Calculate average ratings for courses
    Object.values(courseBreakdown).forEach(course => {
      course.avgRating = course.ratings.reduce((sum, rating) => sum + rating, 0) / course.ratings.length;
    });

    const topCourses = Object.entries(courseBreakdown)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.avgRating - a.avgRating);

    // Response quality analysis
    const qualityMetrics = {
      instructor_quality: 0,
      content_relevance: 0,
      material_quality: 0,
      recommendation_rate: 0
    };

    let validResponses = 0;
    responses.forEach(response => {
      if (response.responses) {
        validResponses++;
        qualityMetrics.instructor_quality += response.responses.instructor_quality || 0;
        qualityMetrics.content_relevance += response.responses.content_relevance || 0;
        qualityMetrics.material_quality += response.responses.material_quality || 0;
        if (response.responses.would_recommend === 'yes') {
          qualityMetrics.recommendation_rate += 1;
        }
      }
    });

    if (validResponses > 0) {
      qualityMetrics.instructor_quality /= validResponses;
      qualityMetrics.content_relevance /= validResponses;
      qualityMetrics.material_quality /= validResponses;
      qualityMetrics.recommendation_rate = (qualityMetrics.recommendation_rate / validResponses) * 100;
    }

    return {
      totalResponses,
      averageRating,
      ratingCounts,
      topCourses,
      qualityMetrics
    };
  };

  const metrics = calculateMetrics();

  if (!metrics) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No evaluation data available</h3>
          <p className="text-muted-foreground">
            Submit some evaluations to generate a comprehensive report
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Training Evaluation Report</CardTitle>
              <p className="text-muted-foreground mt-1">
                Comprehensive analysis of {metrics.totalResponses} evaluation responses
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onExport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => onExport('xlsx')}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={() => onExport('pptx')} className="bg-gradient-primary hover:bg-primary-hover">
                <Download className="w-4 h-4 mr-2" />
                Export PowerPoint
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{metrics.totalResponses}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {metrics.averageRating.toFixed(1)}/5
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recommendation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {metrics.qualityMetrics.recommendation_rate.toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Report Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Date().toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.ratingCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="rating" 
                  tickFormatter={(value) => `${value} Star${value !== '1' ? 's' : ''}`}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.ratingCounts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ rating, percentage }) => `${rating} (${percentage.toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.ratingCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quality Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Instructor Quality</span>
              <span className="font-medium">{metrics.qualityMetrics.instructor_quality.toFixed(1)}/5</span>
            </div>
            <Progress value={(metrics.qualityMetrics.instructor_quality / 5) * 100} />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span>Content Relevance</span>
              <span className="font-medium">{metrics.qualityMetrics.content_relevance.toFixed(1)}/5</span>
            </div>
            <Progress value={(metrics.qualityMetrics.content_relevance / 5) * 100} />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span>Material Quality</span>
              <span className="font-medium">{metrics.qualityMetrics.material_quality.toFixed(1)}/5</span>
            </div>
            <Progress value={(metrics.qualityMetrics.material_quality / 5) * 100} />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span>Would Recommend</span>
              <span className="font-medium">{metrics.qualityMetrics.recommendation_rate.toFixed(0)}%</span>
            </div>
            <Progress value={metrics.qualityMetrics.recommendation_rate} />
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Courses */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Course Performance Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topCourses.slice(0, 10).map((course, index) => (
              <div key={course.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{course.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {course.count} response{course.count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">{course.avgRating.toFixed(1)}/5</div>
                    <div className="text-xs text-muted-foreground">Average Rating</div>
                  </div>
                  <Badge variant={index < 3 ? 'default' : 'secondary'}>
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {responses.slice(0, 5).map((response) => (
              <div key={response.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{response.employee?.name || 'Anonymous'}</span>
                    <Badge variant="outline">{response.session?.course?.title}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < response.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                {response.responses?.most_valuable && (
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Most Valuable:</strong> {response.responses.most_valuable}
                  </p>
                )}
                {response.responses?.additional_comments && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Comments:</strong> {response.responses.additional_comments}
                  </p>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(response.submitted_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}