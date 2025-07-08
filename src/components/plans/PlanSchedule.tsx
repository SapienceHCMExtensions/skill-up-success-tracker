import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlanScheduleProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function PlanSchedule({ formData, setFormData }: PlanScheduleProps) {
  const updateModuleSchedule = (moduleId: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules?.map(module => 
        module.id === moduleId 
          ? { ...module, [field]: value }
          : module
      ) || []
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            min="2020"
            max="2030"
            value={formData.year || new Date().getFullYear()}
            onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="quarter">Quarter (Optional)</Label>
          <select
            id="quarter"
            value={formData.quarter || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, quarter: e.target.value ? parseInt(e.target.value) : null }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="">No specific quarter</option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
        </div>
      </div>

      {/* Module Scheduling */}
      {(formData.modules || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Module Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formData.modules || []).map((module: any) => (
              <div key={module.id} className="border rounded p-4 space-y-3">
                <h4 className="font-medium">{module.name}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`start-${module.id}`}>Start Date</Label>
                    <Input
                      id={`start-${module.id}`}
                      type="datetime-local"
                      value={module.start_date || ''}
                      onChange={(e) => updateModuleSchedule(module.id, 'start_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`end-${module.id}`}>End Date</Label>
                    <Input
                      id={`end-${module.id}`}
                      type="datetime-local"
                      value={module.end_date || ''}
                      onChange={(e) => updateModuleSchedule(module.id, 'end_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}