import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, FileText, Receipt } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Session = Tables<'sessions'> & {
  course?: Tables<'courses'>;
  plan?: Tables<'plans'>;
};

interface CostFormProps {
  onSubmit: (data: {
    sessionId: string;
    amount: number;
    description?: string;
    invoiceNo?: string;
  }) => Promise<{ data: any; error: any }>;
  loading: boolean;
}

export function CostForm({ onSubmit, loading }: CostFormProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [formData, setFormData] = useState({
    sessionId: '',
    amount: '',
    description: '',
    invoiceNo: '',
  });
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          course:courses(*),
          plan:plans(*)
        `)
        .eq('status', 'completed')
        .order('end_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch training sessions",
        variant: "destructive",
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sessionId || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const result = await onSubmit({
      sessionId: formData.sessionId,
      amount,
      description: formData.description || undefined,
      invoiceNo: formData.invoiceNo || undefined,
    });

    if (!result.error) {
      setFormData({
        sessionId: '',
        amount: '',
        description: '',
        invoiceNo: '',
      });
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Record Training Cost
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session">Training Session *</Label>
              <Select
                value={formData.sessionId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, sessionId: value }))}
                disabled={loadingSessions}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSessions ? "Loading sessions..." : "Select a session"} />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{session.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {session.course?.title} • {new Date(session.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-10"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNo">Invoice/Reference Number</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invoiceNo"
                  placeholder="INV-2024-001"
                  className="pl-10"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNo: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Training materials, venue rental, instructor fees..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={loading || loadingSessions}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              {loading ? 'Recording...' : 'Record Cost'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}