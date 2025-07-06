import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Department = Tables<'departments'>;

interface FilterOptions {
  department?: string;
  name?: string;
  complianceStatus?: string;
  minScore?: number;
  maxScore?: number;
  hasExpiring?: boolean;
}

interface ScorecardFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  activeFilters: FilterOptions;
}

export function ScorecardFilters({ onFiltersChange, activeFilters }: ScorecardFiltersProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(activeFilters);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).filter(key => 
      activeFilters[key as keyof FilterOptions] !== undefined && 
      activeFilters[key as keyof FilterOptions] !== ''
    ).length;
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Employees
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdvanced(!isAdvanced)}
            >
              {isAdvanced ? 'Simple' : 'Advanced'} Filters
            </Button>
            {getActiveFilterCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name-filter">Employee Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="name-filter"
                placeholder="Search by name..."
                value={localFilters.name || ''}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="department-filter">Department</Label>
            <Select
              value={localFilters.department || ''}
              onValueChange={(value) => handleFilterChange('department', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {isAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="compliance-filter">Compliance Status</Label>
                <Select
                  value={localFilters.complianceStatus || ''}
                  onValueChange={(value) => handleFilterChange('complianceStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="expiring-filter"
                  checked={localFilters.hasExpiring || false}
                  onCheckedChange={(checked) => handleFilterChange('hasExpiring', checked)}
                />
                <Label htmlFor="expiring-filter">
                  Has Expiring Certificates
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-score">Minimum Score</Label>
                <Input
                  id="min-score"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={localFilters.minScore || ''}
                  onChange={(e) => handleFilterChange('minScore', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>

              <div>
                <Label htmlFor="max-score">Maximum Score</Label>
                <Input
                  id="max-score"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  value={localFilters.maxScore || ''}
                  onChange={(e) => handleFilterChange('maxScore', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}