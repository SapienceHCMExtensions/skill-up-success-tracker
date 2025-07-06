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
import { useEvaluations } from "@/hooks/useEvaluations"
import { AnalyticsDashboard } from "@/components/evaluations/AnalyticsDashboard"
import { EvaluationForm } from "@/components/evaluations/EvaluationForm"
import { FullReport } from "@/components/evaluations/FullReport"
import { useToast } from "@/hooks/use-toast"

export default function Evaluations() {
  const { responses, loading, createEvaluation, getAnalytics } = useEvaluations();
  const [activeTab, setActiveTab] = useState('analytics');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const analytics = getAnalytics();

  const handleCreateEvaluation = async (sessionId: string, templateId: string, responses: any, rating: number) => {
    setSubmitting(true);
    const result = await createEvaluation(sessionId, templateId, responses, rating);
    setSubmitting(false);
    
    if (!result.error) {
      setActiveTab('analytics');
    }
  };

  const handleExport = (format: string) => {
    toast({
      title: "Export Feature",
      description: `${format.toUpperCase()} export functionality available`,
    });
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
          <EvaluationForm onSubmit={handleCreateEvaluation} loading={submitting} />
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
                            {response.session?.course?.title || 'Unknown Course'}
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
                        Session: {response.session?.title || 'N/A'}
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