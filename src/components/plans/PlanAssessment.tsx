import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface PlanAssessmentProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function PlanAssessment({ formData, setFormData }: PlanAssessmentProps) {
  const [newEvaluation, setNewEvaluation] = useState({
    evaluation_type: '',
    title: '',
    description: ''
  });

  const [newMetric, setNewMetric] = useState({
    name: '',
    target: '',
    description: ''
  });

  const addEvaluation = () => {
    if (newEvaluation.title && newEvaluation.evaluation_type) {
      setFormData(prev => ({
        ...prev,
        evaluations: [...(prev.evaluations || []), { ...newEvaluation, id: Date.now() }]
      }));
      setNewEvaluation({ evaluation_type: '', title: '', description: '' });
    }
  };

  const removeEvaluation = (id: number) => {
    setFormData(prev => ({
      ...prev,
      evaluations: prev.evaluations?.filter(evaluation => evaluation.id !== id) || []
    }));
  };

  const addMetric = () => {
    if (newMetric.name && newMetric.target) {
      setFormData(prev => ({
        ...prev,
        success_metrics: [...(prev.success_metrics || []), { ...newMetric, id: Date.now() }]
      }));
      setNewMetric({ name: '', target: '', description: '' });
    }
  };

  const removeMetric = (id: number) => {
    setFormData(prev => ({
      ...prev,
      success_metrics: prev.success_metrics?.filter(metric => metric.id !== id) || []
    }));
  };

  return (
    <div className="space-y-6">
      {/* Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Evaluations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eval-type">Evaluation Type</Label>
              <Select
                value={newEvaluation.evaluation_type}
                onValueChange={(value) => setNewEvaluation(prev => ({ ...prev, evaluation_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_test">Pre-Test</SelectItem>
                  <SelectItem value="post_test">Post-Test</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="survey">Survey</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="eval-title">Title</Label>
              <Input
                id="eval-title"
                value={newEvaluation.title}
                onChange={(e) => setNewEvaluation(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter evaluation title"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="eval-description">Description</Label>
            <Textarea
              id="eval-description"
              value={newEvaluation.description}
              onChange={(e) => setNewEvaluation(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the evaluation"
              rows={3}
            />
          </div>

          <Button type="button" onClick={addEvaluation} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Evaluation
          </Button>

          <div className="space-y-2">
            {(formData.evaluations || []).map((evaluation: any) => (
              <div key={evaluation.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <h4 className="font-medium">{evaluation.title}</h4>
                  <p className="text-sm text-muted-foreground">{evaluation.evaluation_type.replace('_', ' ')}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEvaluation(evaluation.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Success Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="metric-name">Metric Name</Label>
              <Input
                id="metric-name"
                value={newMetric.name}
                onChange={(e) => setNewMetric(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Completion Rate"
              />
            </div>
            <div>
              <Label htmlFor="metric-target">Target</Label>
              <Input
                id="metric-target"
                value={newMetric.target}
                onChange={(e) => setNewMetric(prev => ({ ...prev, target: e.target.value }))}
                placeholder="e.g., 90%"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="metric-description">Description</Label>
            <Textarea
              id="metric-description"
              value={newMetric.description}
              onChange={(e) => setNewMetric(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe how this metric will be measured"
              rows={2}
            />
          </div>

          <Button type="button" onClick={addMetric} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Metric
          </Button>

          <div className="space-y-2">
            {(formData.success_metrics || []).map((metric: any) => (
              <div key={metric.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <h4 className="font-medium">{metric.name}</h4>
                  <p className="text-sm text-muted-foreground">Target: {metric.target}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMetric(metric.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}