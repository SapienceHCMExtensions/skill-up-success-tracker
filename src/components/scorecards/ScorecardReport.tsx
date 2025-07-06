import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Award, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

type ScoreCardData = {
  employee: any;
  totalTrainings: number;
  completedTrainings: number;
  inProgressTrainings: number;
  certificatesEarned: number;
  certificatesExpiring: number;
  averageScore: number;
  lastTrainingDate: string | null;
  complianceStatus: 'compliant' | 'non-compliant' | 'warning';
  overallScore: number;
};

interface ScorecardReportProps {
  scorecards: ScoreCardData[];
}

export function ScorecardReport({ scorecards }: ScorecardReportProps) {
  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'non-compliant':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getComplianceBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-success text-white">Compliant</Badge>;
      case 'warning':
        return <Badge className="bg-warning text-white">Warning</Badge>;
      case 'non-compliant':
        return <Badge className="bg-destructive text-white">Non-Compliant</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (scorecards.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No scorecards generated</h3>
          <p className="text-muted-foreground">
            Select employees and generate a report to see their training scorecards
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary statistics
  const totalEmployees = scorecards.length;
  const averageOverallScore = Math.round(
    scorecards.reduce((sum, card) => sum + card.overallScore, 0) / totalEmployees
  );
  const compliantCount = scorecards.filter(card => card.complianceStatus === 'compliant').length;
  const warningCount = scorecards.filter(card => card.complianceStatus === 'warning').length;
  const nonCompliantCount = scorecards.filter(card => card.complianceStatus === 'non-compliant').length;

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageOverallScore)}`}>
              {averageOverallScore}%
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {compliantCount}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round((compliantCount / totalEmployees) * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Need Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {warningCount + nonCompliantCount}
            </div>
            <div className="text-xs text-muted-foreground">
              {warningCount} warning, {nonCompliantCount} non-compliant
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Scorecards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scorecards.map((scorecard) => (
          <Card key={scorecard.employee.id} className="shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(scorecard.employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{scorecard.employee.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{scorecard.employee.email}</p>
                    {scorecard.employee.department && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {scorecard.employee.department.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(scorecard.overallScore)}`}>
                    {scorecard.overallScore}%
                  </div>
                  {getComplianceBadge(scorecard.complianceStatus)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Training Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Training Completion</span>
                  <span className="text-sm text-muted-foreground">
                    {scorecard.completedTrainings}/{scorecard.totalTrainings}
                  </span>
                </div>
                <Progress 
                  value={scorecard.totalTrainings > 0 ? (scorecard.completedTrainings / scorecard.totalTrainings) * 100 : 0} 
                  className="h-2"
                />
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{scorecard.totalTrainings}</div>
                    <div className="text-xs text-muted-foreground">Total Trainings</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{scorecard.certificatesEarned}</div>
                    <div className="text-xs text-muted-foreground">Certificates</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{scorecard.averageScore.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Avg Score</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{scorecard.inProgressTrainings}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {scorecard.certificatesExpiring > 0 && (
                <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm">
                    {scorecard.certificatesExpiring} certificate(s) expiring soon
                  </span>
                </div>
              )}

              {/* Last Training */}
              {scorecard.lastTrainingDate && (
                <div className="text-xs text-muted-foreground">
                  Last training completed: {new Date(scorecard.lastTrainingDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}