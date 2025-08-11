import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailTemplate { id: string; name: string; category: string; subject: string; html: string; is_active: boolean; }

export default function EmailTemplates() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.title = "Email Templates | Admin";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Create and manage reusable email templates');
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('email_templates').select('*').order('updated_at', { ascending: false });
    if (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load templates', variant: 'destructive' });
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = { name: editing.name, category: editing.category, subject: editing.subject, html: editing.html, is_active: editing.is_active };
    const { error } = editing.id
      ? await supabase.from('email_templates').update(payload).eq('id', editing.id)
      : await supabase.from('email_templates').insert(payload);
    if (error) {
      console.error(error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Template saved successfully' });
      setOpen(false); setEditing(null);
      load();
    }
  };

  const sendTest = async (tpl: EmailTemplate) => {
    const to = prompt('Send test email to:');
    if (!to) return;
    const { data, error } = await supabase.functions.invoke('send-templated-email', {
      body: { to: [to], template_id: tpl.id, variables: { name: 'Test User' } }
    });
    if (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to send test email', variant: 'destructive' });
    } else {
      toast({ title: 'Sent', description: 'Test email requested' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Create and manage reusable email templates</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ id: '', name: '', category: 'general', subject: '', html: '', is_active: true })}>New Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editing?.id ? 'Edit Template' : 'New Template'}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
                </div>
                <div>
                  <Label>HTML</Label>
                  <textarea className="w-full h-64 border rounded p-2" value={editing.html} onChange={(e) => setEditing({ ...editing, html: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Use {"{{variable}}"} placeholders. Example: Hello, {"{{name}}"}.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={save}>Save</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell className="truncate max-w-[300px]">{t.subject}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditing(t); setOpen(true); }}>Edit</Button>
                      <Button variant="secondary" size="sm" onClick={() => sendTest(t)}>Send Test</Button>
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
