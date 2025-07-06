import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Users, CheckCircle, XCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Employee = Tables<'employees'> & {
  department?: Tables<'departments'>;
};

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployees: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onGenerateReport: () => void;
  loading?: boolean;
}

export function EmployeeSelector({ 
  employees, 
  selectedEmployees, 
  onSelectionChange, 
  onGenerateReport,
  loading 
}: EmployeeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (employee.department?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onSelectionChange(filteredEmployees.map(emp => emp.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    const isSelected = selectedEmployees.includes(employeeId);
    if (isSelected) {
      onSelectionChange(selectedEmployees.filter(id => id !== employeeId));
    } else {
      onSelectionChange([...selectedEmployees, employeeId]);
    }
  };

  const isAllSelected = filteredEmployees.length > 0 && 
    filteredEmployees.every(emp => selectedEmployees.includes(emp.id));

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Select Employees for Scorecard Report
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Select All */}
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="select-all" className="flex items-center gap-2">
            Select All ({filteredEmployees.length} employees)
            {selectedEmployees.length > 0 && (
              <Badge variant="secondary">
                {selectedEmployees.length} selected
              </Badge>
            )}
          </Label>
        </div>

        {/* Employee List */}
        <div className="max-h-60 overflow-y-auto space-y-2">
          {filteredEmployees.map(employee => (
            <div
              key={employee.id}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              onClick={() => handleEmployeeToggle(employee.id)}
            >
              <Checkbox
                checked={selectedEmployees.includes(employee.id)}
                onChange={() => handleEmployeeToggle(employee.id)}
              />
              <div className="flex-1">
                <div className="font-medium">{employee.name}</div>
                <div className="text-sm text-muted-foreground">{employee.email}</div>
                {employee.department && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {employee.department.name}
                  </Badge>
                )}
              </div>
              {selectedEmployees.includes(employee.id) ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p>No employees found</p>
          </div>
        )}

        {/* Generate Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={onGenerateReport}
            disabled={selectedEmployees.length === 0 || loading}
            className="w-full bg-gradient-primary hover:bg-primary-hover"
          >
            {loading ? 'Generating...' : `Generate Report for ${selectedEmployees.length} Employee(s)`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}