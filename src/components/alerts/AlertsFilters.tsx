import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";

interface AlertsFiltersProps {
  urgencyFilter: string;
  departmentFilter: string;
  employeeSearch: string;
  onUrgencyChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onEmployeeSearchChange: (value: string) => void;
  onManualCheck: () => void;
  isLoading?: boolean;
  departments: Array<{ id: string; name: string }>;
}

export function AlertsFilters({
  urgencyFilter,
  departmentFilter,
  employeeSearch,
  onUrgencyChange,
  onDepartmentChange,
  onEmployeeSearchChange,
  onManualCheck,
  isLoading = false,
  departments
}: AlertsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">Search Employee</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={employeeSearch}
            onChange={(e) => onEmployeeSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Urgency Level</label>
        <Select value={urgencyFilter} onValueChange={onUrgencyChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Upcoming</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Department</label>
        <Select value={departmentFilter} onValueChange={onDepartmentChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={onManualCheck} 
        disabled={isLoading}
        variant="outline"
        className="whitespace-nowrap"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Manual Check
      </Button>
    </div>
  );
}