import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Upload, Link } from 'lucide-react';

interface PlanContentProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function PlanContent({ formData, setFormData }: PlanContentProps) {
  const [newModule, setNewModule] = useState({
    name: '',
    content_type: '',
    duration_hours: 0,
    learning_outcomes: ''
  });

  const [newResource, setNewResource] = useState({
    name: '',
    resource_type: 'link',
    url_or_path: '',
    description: ''
  });

  const addModule = () => {
    if (newModule.name) {
      setFormData(prev => ({
        ...prev,
        modules: [...(prev.modules || []), { ...newModule, id: Date.now() }]
      }));
      setNewModule({ name: '', content_type: '', duration_hours: 0, learning_outcomes: '' });
    }
  };

  const removeModule = (id: number) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules?.filter(module => module.id !== id) || []
    }));
  };

  const addResource = () => {
    if (newResource.name && newResource.url_or_path) {
      setFormData(prev => ({
        ...prev,
        resources: [...(prev.resources || []), { ...newResource, id: Date.now() }]
      }));
      setNewResource({ name: '', resource_type: 'link', url_or_path: '', description: '' });
    }
  };

  const removeResource = (id: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources?.filter(resource => resource.id !== id) || []
    }));
  };

  return (
    <div className="space-y-6">
      {/* Training Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="module-name">Module Name</Label>
              <Input
                id="module-name"
                value={newModule.name}
                onChange={(e) => setNewModule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter module name"
              />
            </div>
            <div>
              <Label htmlFor="content-type">Content Type</Label>
              <Select
                value={newModule.content_type}
                onValueChange={(value) => setNewModule(prev => ({ ...prev, content_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="hands-on">Hands-on</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                step="0.5"
                value={newModule.duration_hours}
                onChange={(e) => setNewModule(prev => ({ ...prev, duration_hours: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="learning-outcomes">Learning Outcomes</Label>
            <Textarea
              id="learning-outcomes"
              value={newModule.learning_outcomes}
              onChange={(e) => setNewModule(prev => ({ ...prev, learning_outcomes: e.target.value }))}
              placeholder="Describe what participants will learn"
              rows={3}
            />
          </div>

          <Button type="button" onClick={addModule} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Module
          </Button>

          {/* Display added modules */}
          <div className="space-y-2">
            {(formData.modules || []).map((module: any) => (
              <div key={module.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <h4 className="font-medium">{module.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {module.content_type} • {module.duration_hours}h
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeModule(module.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resource-name">Resource Name</Label>
              <Input
                id="resource-name"
                value={newResource.name}
                onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter resource name"
              />
            </div>
            <div>
              <Label htmlFor="resource-type">Type</Label>
              <Select
                value={newResource.resource_type}
                onValueChange={(value) => setNewResource(prev => ({ ...prev, resource_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="resource-url">URL or File Path</Label>
            <div className="flex gap-2">
              <Input
                id="resource-url"
                value={newResource.url_or_path}
                onChange={(e) => setNewResource(prev => ({ ...prev, url_or_path: e.target.value }))}
                placeholder="Enter URL or file path"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="resource-description">Description</Label>
            <Textarea
              id="resource-description"
              value={newResource.description}
              onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the resource"
              rows={2}
            />
          </div>

          <Button type="button" onClick={addResource} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>

          {/* Display added resources */}
          <div className="space-y-2">
            {(formData.resources || []).map((resource: any) => (
              <div key={resource.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <h4 className="font-medium">{resource.name}</h4>
                  <p className="text-sm text-muted-foreground">{resource.resource_type}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeResource(resource.id)}
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