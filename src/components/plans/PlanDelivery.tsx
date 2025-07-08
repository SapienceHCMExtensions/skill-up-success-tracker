import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PlanDeliveryProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function PlanDelivery({ formData, setFormData }: PlanDeliveryProps) {
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, name, email')
      .order('name');
    setTrainers(data || []);
  };

  const addTool = (tool: string) => {
    if (tool && !(formData.tools_required || []).includes(tool)) {
      setFormData(prev => ({
        ...prev,
        tools_required: [...(prev.tools_required || []), tool]
      }));
    }
  };

  const removeTool = (toolToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tools_required: prev.tools_required?.filter(tool => tool !== toolToRemove) || []
    }));
  };

  const addTrainer = () => {
    if (selectedTrainer && !(formData.trainers || []).some(t => t.trainer_id === selectedTrainer)) {
      const trainer = trainers.find((t: any) => t.id === selectedTrainer);
      setFormData(prev => ({
        ...prev,
        trainers: [...(prev.trainers || []), { 
          trainer_id: selectedTrainer, 
          name: trainer?.name,
          role: 'instructor' 
        }]
      }));
      setSelectedTrainer('');
    }
  };

  const removeTrainer = (trainerId: string) => {
    setFormData(prev => ({
      ...prev,
      trainers: prev.trainers?.filter(trainer => trainer.trainer_id !== trainerId) || []
    }));
  };

  return (
    <div className="space-y-6">
      {/* Delivery Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="delivery_mode">Format</Label>
            <Select
              value={formData.delivery_mode || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_mode: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="blended">Blended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assign Trainers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assign Trainers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select trainer" />
              </SelectTrigger>
              <SelectContent>
                {trainers.map((trainer: any) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={addTrainer}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {(formData.trainers || []).map((trainer: any) => (
              <div key={trainer.trainer_id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{trainer.name}</p>
                  <p className="text-sm text-muted-foreground">{trainer.role}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTrainer(trainer.trainer_id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tools Required */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tools Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Add tool and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTool(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {(formData.tools_required || []).map((tool: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tool}
                <button
                  type="button"
                  onClick={() => removeTool(tool)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location/Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location/Platform Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.location_platform_info || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, location_platform_info: e.target.value }))}
            placeholder="Enter location details or platform information"
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}