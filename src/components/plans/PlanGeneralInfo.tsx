import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface PlanGeneralInfoProps {
  formData: any;
  setFormData: (data: any) => void;
  departments: any[];
}

export function PlanGeneralInfo({ formData, setFormData, departments }: PlanGeneralInfoProps) {
  const addSkillTag = (tag: string) => {
    if (tag && !formData.skill_gap_tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        skill_gap_tags: [...(prev.skill_gap_tags || []), tag]
      }));
    }
  };

  const removeSkillTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skill_gap_tags: prev.skill_gap_tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...(prev.objectives || []), '']
    }));
  };

  const updateObjective = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives?.map((obj, i) => i === index ? value : obj) || []
    }));
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Plan Title</Label>
        <Input
          id="name"
          value={formData.name || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter training plan title"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the training plan"
          rows={4}
        />
      </div>

      <div>
        <Label>Objectives</Label>
        <div className="space-y-2">
          {(formData.objectives || []).map((objective: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={objective}
                onChange={(e) => updateObjective(index, e.target.value)}
                placeholder={`Objective ${index + 1}`}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeObjective(index)}
                className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addObjective}
            className="text-sm text-primary hover:underline"
          >
            + Add Objective
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="target_audience">Target Audience</Label>
        <Textarea
          id="target_audience"
          value={formData.target_audience || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
          placeholder="Describe the target audience for this training"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="department_id">Department</Label>
        <Select
          value={formData.department_id || ''}
          onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value === "all" ? "" : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Skill Gap Tags</Label>
        <div className="space-y-2">
          <Input
            placeholder="Add skill gap tag and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkillTag(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {(formData.skill_gap_tags || []).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeSkillTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}