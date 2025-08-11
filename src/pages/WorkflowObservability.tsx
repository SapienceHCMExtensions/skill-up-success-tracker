import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Instance { id: string; status: string; entity_type: string; entity_id: string; created_at: string; updated_at: string; current_node_id: string | null; retry_count: number }
interface Event { id: string; event_type: string; message: string | null; created_at: string; metadata: any }
interface Task { id: string; node_id: string; status: string; created_at: string; updated_at: string }

export default function WorkflowObservability() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Instance | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    document.title = "Workflow Observability | Admin";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Inspect workflow instances, timelines, and retry failures');
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('workflow_instances').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load instances', variant: 'destructive' });
    } else {
      setInstances(data as any);
    }
    setLoading(false);
  };

  const loadDetails = async (inst: Instance) => {
    const [{ data: ev }, { data: ts }] = await Promise.all([
      supabase.from('workflow_instance_events').select('*').eq('instance_id', inst.id).order('created_at', { ascending: true }),
      supabase.from('workflow_tasks').select('*').eq('instance_id', inst.id).order('created_at', { ascending: true }),
    ]);
    setEvents((ev as any) || []);
    setTasks((ts as any) || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => instances.filter(i =>
    i.id.includes(query) || (i.entity_type ?? '').toLowerCase().includes(query.toLowerCase()) || (i.status ?? '').toLowerCase().includes(query.toLowerCase())
  ), [instances, query]);

  const retry = async (instance: Instance) => {
    const node = prompt('Optional: retry from node id (leave blank to keep current)');
    const { error } = await supabase.functions.invoke('workflow-retry', { body: { instance_id: instance.id, node_id: node || undefined } });
    if (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Retry failed', variant: 'destructive' });
    } else {
      toast({ title: 'Retry requested', description: `Instance ${instance.id}` });
      load();
      if (selected?.id === instance.id) loadDetails(instance);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Observability</h1>
          <p className="text-muted-foreground">Inspect workflow instances and timelines; retry failures.</p>
        </div>
        <Input placeholder="Search by id, type, status..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instances</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Node</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(inst => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-mono text-xs">{inst.id}</TableCell>
                    <TableCell>{inst.status}</TableCell>
                    <TableCell>{inst.entity_type}</TableCell>
                    <TableCell className="font-mono text-xs">{inst.current_node_id ?? '-'}</TableCell>
                    <TableCell>{inst.retry_count ?? 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog open={open && selected?.id === inst.id} onOpenChange={(v) => { setOpen(v); if (!v) setSelected(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => { setSelected(inst); loadDetails(inst); }}>View</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Instance {selected?.id}</DialogTitle>
                          </DialogHeader>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-medium mb-2">Timeline</h3>
                              <div className="space-y-2 max-h-80 overflow-auto">
                                {events.map(ev => (
                                  <div key={ev.id} className="p-2 rounded border">
                                    <div className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</div>
                                    <div className="text-sm font-medium">{ev.event_type}</div>
                                    {ev.message && <div className="text-sm">{ev.message}</div>}
                                  </div>
                                ))}
                                {events.length === 0 && <div className="text-sm text-muted-foreground">No events</div>}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Tasks</h3>
                              <div className="space-y-2 max-h-80 overflow-auto">
                                {tasks.map(tsk => (
                                  <div key={tsk.id} className="p-2 rounded border">
                                    <div className="text-xs text-muted-foreground">{new Date(tsk.created_at).toLocaleString()}</div>
                                    <div className="text-sm">{tsk.node_id} — <span className="font-medium">{tsk.status}</span></div>
                                  </div>
                                ))}
                                {tasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks</div>}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" onClick={() => retry(inst)}>Retry</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
