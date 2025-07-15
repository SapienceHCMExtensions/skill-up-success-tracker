import { useState, useEffect } from 'react';
import { useCertificateAlerts } from '@/hooks/useCertificateAlerts';
import { AlertsStats } from '@/components/alerts/AlertsStats';
import { AlertsFilters } from '@/components/alerts/AlertsFilters';
import { AlertsTable } from '@/components/alerts/AlertsTable';
import { supabase } from '@/integrations/supabase/client';

export default function Alerts() {
  const { alerts, loading, stats, filterAlerts, triggerManualCheck } = useCertificateAlerts();
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  
  // Filter states
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Fetch departments for filter
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (data) {
        setDepartments(data);
      }
    };
    
    fetchDepartments();
  }, []);

  // Apply filters
  const filteredAlerts = filterAlerts(
    urgencyFilter !== 'all' ? urgencyFilter as 'critical' | 'warning' | 'info' : undefined,
    departmentFilter !== 'all' ? departmentFilter : undefined,
    employeeSearch || undefined
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Certificate Alerts</h1>
        <p className="text-muted-foreground mt-1">
          Monitor certificate expiry dates and manage automated alerts
        </p>
      </div>

      <AlertsStats stats={stats} />

      <div className="space-y-4">
        <AlertsFilters
          urgencyFilter={urgencyFilter}
          departmentFilter={departmentFilter}
          employeeSearch={employeeSearch}
          onUrgencyChange={setUrgencyFilter}
          onDepartmentChange={setDepartmentFilter}
          onEmployeeSearchChange={setEmployeeSearch}
          onManualCheck={triggerManualCheck}
          isLoading={loading}
          departments={departments}
        />

        <AlertsTable alerts={filteredAlerts} isLoading={loading} />
      </div>
    </div>
  );
}