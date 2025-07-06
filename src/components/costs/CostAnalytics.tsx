import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

interface CostSummary {
  totalEstimated: number;
  totalActual: number;
  variance: number;
  variancePercentage: number;
  monthlyData: Array<{
    month: string;
    estimated: number;
    actual: number;
    variance: number;
  }>;
  departmentBreakdown: Array<{
    department: string;
    estimated: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  }>;
  planBreakdown: Array<{
    planName: string;
    estimated: number;
    actual: number;
    variance: number;
    status: 'under' | 'over' | 'on-track';
  }>;
}

interface CostAnalyticsProps {
  costSummary: CostSummary;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function CostAnalytics({ costSummary }: CostAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getVarianceStatus = (percentage: number) => {
    if (percentage > 10) return { status: 'over', color: 'destructive' };
    if (percentage < -10) return { status: 'under', color: 'default' };
    return { status: 'on-track', color: 'secondary' };
  };

  const varianceStatus = getVarianceStatus(costSummary.variancePercentage);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Estimated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(costSummary.totalEstimated)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(costSummary.totalActual)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {costSummary.variance >= 0 ? (
                <TrendingUp className="w-4 h-4 text-destructive" />
              ) : (
                <TrendingDown className="w-4 h-4 text-success" />
              )}
              Budget Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${costSummary.variance >= 0 ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(Math.abs(costSummary.variance))}
            </div>
            <div className="text-sm text-muted-foreground">
              {costSummary.variance >= 0 ? 'Over budget' : 'Under budget'}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Variance %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${costSummary.variance >= 0 ? 'text-destructive' : 'text-success'}`}>
                {Math.abs(costSummary.variancePercentage).toFixed(1)}%
              </div>
              <Badge variant={varianceStatus.color as any}>
                {varianceStatus.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Monthly Cost Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costSummary.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="estimated" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Estimated"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Actual"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department and Plan Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Department Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costSummary.departmentBreakdown.map((dept) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{dept.department}</span>
                    <Badge variant={getVarianceStatus(dept.variancePercentage).color as any}>
                      {dept.variancePercentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Estimated: {formatCurrency(dept.estimated)} | 
                    Actual: {formatCurrency(dept.actual)}
                  </div>
                  <Progress 
                    value={Math.min((dept.actual / dept.estimated) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Plan Status */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Training Plan Budget Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costSummary.planBreakdown.slice(0, 8).map((plan) => (
                <div key={plan.planName} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{plan.planName}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(plan.actual)} / {formatCurrency(plan.estimated)}
                    </div>
                  </div>
                  <Badge 
                    variant={
                      plan.status === 'over' ? 'destructive' : 
                      plan.status === 'under' ? 'default' : 
                      'secondary'
                    }
                  >
                    {plan.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variance Distribution */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Budget Variance by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costSummary.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar 
                dataKey="variance" 
                fill="#8884d8"
                name="Variance"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}