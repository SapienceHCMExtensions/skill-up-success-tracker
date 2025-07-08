import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface PlanBudgetProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function PlanBudget({ formData, setFormData }: PlanBudgetProps) {
  const [newCostItem, setNewCostItem] = useState({
    item_name: '',
    cost: 0,
    description: ''
  });

  const addCostItem = () => {
    if (newCostItem.item_name && newCostItem.cost > 0) {
      setFormData(prev => ({
        ...prev,
        cost_breakdown: [...(prev.cost_breakdown || []), { ...newCostItem, id: Date.now() }]
      }));
      setNewCostItem({ item_name: '', cost: 0, description: '' });
    }
  };

  const removeCostItem = (id: number) => {
    setFormData(prev => ({
      ...prev,
      cost_breakdown: prev.cost_breakdown?.filter(item => item.id !== id) || []
    }));
  };

  const totalCost = (formData.cost_breakdown || []).reduce((sum: number, item: any) => sum + (item.cost || 0), 0);

  // Update estimated_cost when cost breakdown changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, estimated_cost: totalCost }));
  }, [totalCost, setFormData]);

  return (
    <div className="space-y-6">
      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item-name">Item Name</Label>
              <Input
                id="item-name"
                value={newCostItem.item_name}
                onChange={(e) => setNewCostItem(prev => ({ ...prev, item_name: e.target.value }))}
                placeholder="e.g., Trainer Fees"
              />
            </div>
            <div>
              <Label htmlFor="item-cost">Cost ($)</Label>
              <Input
                id="item-cost"
                type="number"
                min="0"
                step="0.01"
                value={newCostItem.cost || ''}
                onChange={(e) => setNewCostItem(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              value={newCostItem.description}
              onChange={(e) => setNewCostItem(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about this cost item"
              rows={2}
            />
          </div>

          <Button type="button" onClick={addCostItem} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Cost Item
          </Button>

          <div className="space-y-2">
            {(formData.cost_breakdown || []).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <h4 className="font-medium">{item.item_name}</h4>
                  <p className="text-sm text-muted-foreground">${item.cost.toFixed(2)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCostItem(item.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {totalCost > 0 && (
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Estimated Cost:</span>
                <span className="text-xl font-bold text-primary">${totalCost.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}