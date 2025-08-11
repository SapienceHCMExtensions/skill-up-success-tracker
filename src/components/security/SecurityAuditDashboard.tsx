import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Eye, Clock, UserCheck, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Papa from 'papaparse';

interface SecurityLog {
  id: string;
  event_type: string;
  user_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function SecurityAuditDashboard() {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();

  // Filters
  const [eventType, setEventType] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  useEffect(() => {
    if (userRole === 'admin') {
      fetchSecurityLogs();
    }
  }, [userRole]);

const fetchSecurityLogs = async () => {
  setLoading(true);
  try {
    let query = supabase
      .from('security_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (eventType !== 'all') query = query.eq('event_type', eventType);
    if (fromDate) query = query.gte('created_at', new Date(fromDate).toISOString());
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    setSecurityLogs((data || []) as SecurityLog[]);
  } catch (error) {
    console.error('Error fetching security logs:', error);
  } finally {
    setLoading(false);
  }
};

const exportCSV = () => {
  const rows = securityLogs.map((l) => ({
    id: l.id,
    event_type: l.event_type,
    user_id: l.user_id,
    ip_address: l.ip_address,
    user_agent: l.user_agent,
    created_at: l.created_at,
    details: l.details ? JSON.stringify(l.details) : '',
  }));
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `security_logs_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'role_assigned':
      case 'role_modified':
      case 'role_removed':
        return <UserCheck className="w-4 h-4" />;
      case 'user_created_via_csv':
        return <Shield className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getEventVariant = (eventType: string) => {
    switch (eventType) {
      case 'role_assigned':
        return 'default';
      case 'role_modified':
        return 'secondary';
      case 'role_removed':
        return 'destructive';
      case 'user_created_via_csv':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (userRole !== 'admin') {
    return (
      <Alert>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Access denied. Only administrators can view security audit logs.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Audit Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Security Fixes Applied</p>
                    <p className="text-2xl font-bold text-green-600">8/9</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Pending Actions</p>
                    <p className="text-2xl font-bold text-yellow-600">1</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Recent Events</p>
                    <p className="text-2xl font-bold text-blue-600">{securityLogs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="mb-6">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Action Required:</strong> Please enable "Leaked Password Protection" in your 
              <a 
                href="https://supabase.com/dashboard/project/jmralbctzpdkjvvurach/auth/providers" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline ml-1"
              >
                Supabase Auth Settings
              </a> 
              to complete the security configuration.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-lg font-semibold">Recent Security Events</h3>
              <div className="flex items-center gap-2">
                <Button onClick={exportCSV} size="sm" variant="outline">Export CSV</Button>
                <Button onClick={fetchSecurityLogs} size="sm" variant="outline">Refresh</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  aria-label="Filter by event type"
                >
                  <option value="all">All events</option>
                  <option value="role_assigned">role_assigned</option>
                  <option value="role_modified">role_modified</option>
                  <option value="role_removed">role_removed</option>
                  <option value="user_created_via_csv">user_created_via_csv</option>
                </select>
              </div>
              <input
                type="date"
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="From date"
              />
              <input
                type="date"
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="To date"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={fetchSecurityLogs}>Apply</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEventType('all'); setFromDate(''); setToDate(''); fetchSecurityLogs(); }}>Clear</Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading security logs...</p>
              </div>
            ) : securityLogs.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No security events recorded yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {securityLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getEventIcon(log.event_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getEventVariant(log.event_type)}>
                              {log.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm">
                            {log.details && (
                              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}