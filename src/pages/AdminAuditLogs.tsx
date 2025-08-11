import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { List, RefreshCcw, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AuditRow {
  id: string;
  table_name: string;
  action: string;
  row_pk: string;
  changed_by: string | null;
  changed_at: string;
  diff: any;
  old_data: any;
  new_data: any;
}

export default function AdminAuditLogs() {
  const { userRole } = useAuth();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [rowSearch, setRowSearch] = useState<string>("");

  useEffect(() => {
    document.title = "Admin: Audit Trail";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "View and filter system audit logs.");
  }, []);

  useEffect(() => {
    if (userRole === "admin") {
      fetchLogs();
    }
  }, [userRole]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase.from("training_audit").select("*").order("changed_at", { ascending: false }).limit(100);
      if (tableFilter !== "all") query = query.eq("table_name", tableFilter);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (fromDate) query = query.gte("changed_at", new Date(fromDate).toISOString());
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("changed_at", end.toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []) as AuditRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = rowSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => l.row_pk?.toString().toLowerCase().includes(q));
  }, [logs, rowSearch]);

  if (userRole !== "admin") {
    return (
      <Alert>
        <AlertDescription>Access denied. Only administrators can view audit logs.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <List className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Trail</h1>
          <p className="text-muted-foreground">Review data changes across the system</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Changes</span>
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                aria-label="Filter by table"
              >
                <option value="all">All tables</option>
                <option value="courses">courses</option>
                <option value="sessions">sessions</option>
                <option value="training_requests">training_requests</option>
                <option value="employees">employees</option>
              </select>
            </div>
            <select
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Filter by action"
            >
              <option value="all">All actions</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="To date" />
            <Input placeholder="Search by Row ID" value={rowSearch} onChange={(e) => setRowSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit events found.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{log.table_name}</Badge>
                      <Badge>{log.action}</Badge>
                      <span className="text-sm text-muted-foreground">{new Date(log.changed_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Row: {log.row_pk}</div>
                    {log.diff && (
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.diff, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
