import { useState } from 'react';
import { useCosts } from '@/hooks/useCosts';
import { CostAnalytics } from '@/components/costs/CostAnalytics';
import { CostForm } from '@/components/costs/CostForm';
import { CostActualsTable } from '@/components/costs/CostActualsTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Plus, Receipt, TrendingUp } from 'lucide-react';

export default function Costs() {
  const { costActuals, loading, createCostActual, getCostSummary } = useCosts();
  const [isFormLoading, setIsFormLoading] = useState(false);

  const handleCreateCost = async (costData: {
    sessionId: string;
    amount: number;
    description?: string;
    invoiceNo?: string;
  }) => {
    setIsFormLoading(true);
    const result = await createCostActual(costData);
    setIsFormLoading(false);
    return result;
  };

  const costSummary = getCostSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cost Management</h1>
          <p className="text-muted-foreground mt-1">
            Track estimated vs actual costs and budget variance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Cost Records
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Cost
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <CostAnalytics costSummary={costSummary} />
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <CostActualsTable costActuals={costActuals} isLoading={loading} />
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <CostForm onSubmit={handleCreateCost} loading={isFormLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}