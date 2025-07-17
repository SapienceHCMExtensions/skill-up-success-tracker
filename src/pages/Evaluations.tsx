import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  FileText, 
  Plus, 
  Eye,
  Download,
  Star,
  Users,
  TrendingUp
} from "lucide-react"
import { useCourseEvaluations } from "@/hooks/useCourseEvaluations"
import { AnalyticsDashboard } from "@/components/evaluations/AnalyticsDashboard"
import { CourseEvaluationForm } from "@/components/evaluations/CourseEvaluationForm"
import { FullReport } from "@/components/evaluations/FullReport"
import { useToast } from "@/hooks/use-toast"

export default function Evaluations() {
  const { responses, loading, createEvaluation, getAnalytics } = useCourseEvaluations();
  const [activeTab, setActiveTab] = useState('analytics');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const analytics = getAnalytics();

  const handleCreateEvaluation = async (courseId: string, templateId: string, responses: any, rating: number, trainingRequestId?: string) => {
    setSubmitting(true);
    const result = await createEvaluation(courseId, templateId, responses, rating, trainingRequestId);
    setSubmitting(false);
    
    if (!result.error) {
      setActiveTab('analytics');
    }
  };

  const handleExport = async (format: string) => {
    if (format === 'pptx') {
      try {
        // Dynamic import to avoid bundle issues
        const PptxGenJS = (await import('pptxgenjs')).default;
        const pptx = new PptxGenJS();
        
        // Set presentation properties
        pptx.author = 'Training Management System';
        pptx.company = 'Organization';
        pptx.revision = '1';
        pptx.subject = 'Training Evaluation Report';
        pptx.title = 'Training Evaluation Analysis';

        // Title slide
        const titleSlide = pptx.addSlide();
        titleSlide.addText('Training Evaluation Report', {
          x: 1, y: 2, w: 8, h: 1.5,
          fontSize: 32, fontFace: 'Arial', color: '363636', bold: true, align: 'center'
        });
        titleSlide.addText(`Generated on ${new Date().toLocaleDateString()}`, {
          x: 1, y: 3.5, w: 8, h: 0.5,
          fontSize: 16, fontFace: 'Arial', color: '666666', align: 'center'
        });
        titleSlide.addText(`${analytics.totalResponses} Total Responses | Average Rating: ${analytics.averageRating.toFixed(1)}/5`, {
          x: 1, y: 4.5, w: 8, h: 0.5,
          fontSize: 14, fontFace: 'Arial', color: '888888', align: 'center'
        });

        // Executive Summary slide
        const summarySlide = pptx.addSlide();
        summarySlide.addText('Executive Summary', {
          x: 0.5, y: 0.5, w: 9, h: 0.8,
          fontSize: 24, fontFace: 'Arial', color: '363636', bold: true
        });

        // Add summary metrics
        const summaryData = [
          ['Metric', 'Value'],
          ['Total Responses', analytics.totalResponses.toString()],
          ['Average Rating', `${analytics.averageRating.toFixed(1)}/5`],
          ['Response Rate This Month', analytics.responsesByMonth.slice(-1)[0]?.responses.toString() || '0'],
          ['Top Performing Course', analytics.topCourses.length > 0 ? analytics.topCourses[0].name : 'N/A']
        ];

        summarySlide.addTable(summaryData, {
          x: 1, y: 1.5, w: 8, h: 3,
          fontSize: 12, fontFace: 'Arial',
          rowH: 0.6, colW: [4, 4],
          border: { pt: 1, color: 'CFCFCF' },
          fill: { color: 'F7F7F7' }
        });

        // Rating Distribution slide
        const ratingSlide = pptx.addSlide();
        ratingSlide.addText('Rating Distribution', {
          x: 0.5, y: 0.5, w: 9, h: 0.8,
          fontSize: 24, fontFace: 'Arial', color: '363636', bold: true
        });

        const ratingData = [
          ['Rating', 'Count', 'Percentage'],
          ...analytics.ratingDistribution.map(item => [
            item.rating,
            item.count.toString(),
            `${((item.count / analytics.totalResponses) * 100).toFixed(1)}%`
          ])
        ];

        ratingSlide.addTable(ratingData, {
          x: 1, y: 1.5, w: 8, h: 4,
          fontSize: 12, fontFace: 'Arial',
          rowH: 0.6, colW: [2.5, 2.5, 3],
          border: { pt: 1, color: 'CFCFCF' },
          fill: { color: 'F7F7F7' }
        });

        // Top Courses slide
        const coursesSlide = pptx.addSlide();
        coursesSlide.addText('Top Performing Courses', {
          x: 0.5, y: 0.5, w: 9, h: 0.8,
          fontSize: 24, fontFace: 'Arial', color: '363636', bold: true
        });

        const courseData = [
          ['Course Name', 'Responses', 'Average Rating'],
          ...analytics.topCourses.slice(0, 10).map(course => [
            course.name,
            course.count.toString(),
            course.avgRating.toFixed(1)
          ])
        ];

        coursesSlide.addTable(courseData, {
          x: 0.5, y: 1.5, w: 9, h: 5,
          fontSize: 11, fontFace: 'Arial',
          rowH: 0.5, colW: [5, 2, 2],
          border: { pt: 1, color: 'CFCFCF' },
          fill: { color: 'F7F7F7' }
        });

        // Recent Feedback slide
        if (responses.length > 0) {
          const feedbackSlide = pptx.addSlide();
          feedbackSlide.addText('Recent Feedback Highlights', {
            x: 0.5, y: 0.5, w: 9, h: 0.8,
            fontSize: 24, fontFace: 'Arial', color: '363636', bold: true
          });

          let yPos = 1.5;
          responses.slice(0, 3).forEach((response, index) => {
            const responseData = response.responses as any;
            const feedbackText = [
              `${response.employee?.name || 'Anonymous'} - ${response.course?.title || 'Unknown Course'}`,
              `Rating: ${response.overall_rating}/5 | ${new Date(response.submitted_at).toLocaleDateString()}`,
              responseData?.course_feedback ? `"${responseData.course_feedback.substring(0, 150)}..."` : 'No detailed feedback provided'
            ].join('\n');

            feedbackSlide.addText(feedbackText, {
              x: 0.5, y: yPos, w: 9, h: 1.3,
              fontSize: 10, fontFace: 'Arial', color: '444444',
              margin: 0.1, bullet: true
            });
            yPos += 1.5;
          });
        }

        // Generate and download
        const fileName = `Training_Evaluation_Report_${new Date().toISOString().split('T')[0]}.pptx`;
        await pptx.writeFile({ fileName });
        
        toast({
          title: "Export Successful",
          description: `PowerPoint presentation "${fileName}" has been downloaded`,
        });
      } catch (error) {
        console.error('PowerPoint export error:', error);
        toast({
          title: "Export Failed",
          description: "Failed to generate PowerPoint presentation. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Export Feature",
        description: `${format.toUpperCase()} export functionality available`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Evaluations</h1>
          <p className="text-muted-foreground mt-1">Analyze feedback and create evaluation reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('xlsx')}>
            <Download className="w-4 h-4 mr-2" />
            Quick Export
          </Button>
          <Button 
            onClick={() => setActiveTab('create')}
            className="bg-gradient-primary hover:bg-primary-hover shadow-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Evaluation
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {analytics.totalResponses}
            </div>
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
            <div className="text-2xl font-bold text-primary">
              {analytics.averageRating.toFixed(1)}/5
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {analytics.responsesByMonth.slice(-1)[0]?.responses || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Course Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {analytics.topCourses.length > 0 ? analytics.topCourses[0].avgRating.toFixed(1) : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            Create Evaluation
          </TabsTrigger>
          <TabsTrigger value="report">
            <Eye className="w-4 h-4 mr-2" />
            Full Report
          </TabsTrigger>
          <TabsTrigger value="responses">
            <FileText className="w-4 h-4 mr-2" />
            All Responses ({responses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard analytics={analytics} onExport={handleExport} />
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <CourseEvaluationForm />
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <FullReport responses={responses} onExport={handleExport} />
        </TabsContent>

        <TabsContent value="responses" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>All Evaluation Responses</CardTitle>
              <CardDescription>
                Complete list of submitted training evaluations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p>No evaluation responses yet</p>
                  </div>
                ) : (
                  responses.map((response) => (
                    <div key={response.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {response.employee?.name || 'Anonymous'}
                          </span>
                          <Badge variant="outline">
                            {response.course?.title || 'Unknown Course'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (response.overall_rating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Course: {response.course?.title || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Submitted: {new Date(response.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}