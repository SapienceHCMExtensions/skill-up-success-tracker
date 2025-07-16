import { ExpenseAnalytics } from '@/components/costs/ExpenseAnalytics';
import { ExpenseForm } from '@/components/costs/ExpenseForm';
import { ExpenseTable } from '@/components/costs/ExpenseTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Plus, Receipt, TrendingUp } from 'lucide-react';

export default function Costs() {

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
          <ExpenseAnalytics />
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <ExpenseTable />
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <ExpenseForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}