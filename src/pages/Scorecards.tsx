import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  Users, 
  Award, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  Filter
} from "lucide-react"
import { useScorecards } from "@/hooks/useScorecards"
import { EmployeeSelector } from "@/components/scorecards/EmployeeSelector"
import { ScorecardFilters } from "@/components/scorecards/ScorecardFilters"
import { ScorecardReport } from "@/components/scorecards/ScorecardReport"

export default function Scorecards() {
  const { employees, scorecards, loading, generating, generateScorecards, filterEmployees } = useScorecards();
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [filters, setFilters] = useState({});
  const [activeTab, setActiveTab] = useState('selector');

  const handleGenerateReport = async () => {
    await generateScorecards(selectedEmployees.length > 0 ? selectedEmployees : undefined);
    setActiveTab('report');
  };

  const filteredEmployees = filterEmployees(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Scorecards</h1>
          <p className="text-muted-foreground mt-1">Generate and analyze training performance reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={scorecards.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button 
            onClick={() => setActiveTab('selector')}
            className="bg-gradient-primary hover:bg-primary-hover shadow-primary"
          >
            <FileText className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="selector">Select Employees</TabsTrigger>
          <TabsTrigger value="filters">Apply Filters</TabsTrigger>
          <TabsTrigger value="report" disabled={scorecards.length === 0}>
            View Report ({scorecards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selector" className="space-y-6">
          <EmployeeSelector
            employees={employees}
            selectedEmployees={selectedEmployees}
            onSelectionChange={setSelectedEmployees}
            onGenerateReport={handleGenerateReport}
            loading={generating}
          />
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <ScorecardFilters
            onFiltersChange={setFilters}
            activeFilters={filters}
          />
          
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Filtered Results</CardTitle>
              <CardDescription>
                {filteredEmployees.length} employees match your filter criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredEmployees.slice(0, 10).map(employee => (
                  <div key={employee.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">{employee.email}</div>
                    </div>
                    {employee.department && (
                      <Badge variant="outline" className="text-xs">
                        {employee.department.name}
                      </Badge>
                    )}
                  </div>
                ))}
                {filteredEmployees.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    +{filteredEmployees.length - 10} more employees
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t mt-4">
                <Button
                  onClick={async () => {
                    const employeeIds = filteredEmployees.map(emp => emp.id);
                    setSelectedEmployees(employeeIds);
                    await generateScorecards(employeeIds);
                    setActiveTab('report');
                  }}
                  disabled={filteredEmployees.length === 0 || generating}
                  className="w-full bg-gradient-primary hover:bg-primary-hover"
                >
                  {generating ? 'Generating...' : `Generate Report for Filtered Employees (${filteredEmployees.length})`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <ScorecardReport scorecards={scorecards} />
        </TabsContent>
      </Tabs>
    </div>
  )
}