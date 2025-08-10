import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function MyTasks() {
  useEffect(() => {
    document.title = 'My Workflow Tasks';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'View and manage your assigned workflow tasks');
  }, []);

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('workflow_tasks')
      .select('id, status, node_type, created_at, due_at, instance_id')
      .order('created_at', { ascending: false });
    if (!error) setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">My Workflow Tasks</h1>
        <p className="text-muted-foreground">Tasks assigned to you across workflows</p>
      </header>
      <Separator />
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">No tasks assigned.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tasks.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t.node_type}</CardTitle>
                <Badge variant="outline">{t.status}</Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex items-center justify-between">
                <span>Instance: {t.instance_id}</span>
                <span>{new Date(t.created_at).toLocaleString()}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
