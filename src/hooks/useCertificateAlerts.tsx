import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type CertificateAlert = Tables<'employee_certificates'> & {
  employees: Tables<'employees'> & {
    department?: Tables<'departments'>;
  };
  courses: Tables<'courses'>;
  daysUntilExpiry: number;
  urgencyLevel: 'critical' | 'warning' | 'info';
};

export function useCertificateAlerts() {
  const [alerts, setAlerts] = useState<CertificateAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    critical: 0,
    warning: 0,
    info: 0,
    total: 0
  });
  const { toast } = useToast();

  const fetchCertificateAlerts = async () => {
    try {
      setLoading(true);
      
      // Calculate date ranges
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(now.getDate() + 60);
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(now.getDate() + 90);

      const { data, error } = await supabase
        .from('employee_certificates')
        .select(`
          *,
          employees!inner(
            *,
            department:departments(*)
          ),
          courses!inner(*)
        `)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', ninetyDaysFromNow.toISOString().split('T')[0])
        .gte('expiry_date', now.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      // Process and categorize alerts
      const processedAlerts: CertificateAlert[] = (data || []).map(cert => {
        const expiryDate = new Date(cert.expiry_date!);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let urgencyLevel: 'critical' | 'warning' | 'info';
        if (daysUntilExpiry <= 30) {
          urgencyLevel = 'critical';
        } else if (daysUntilExpiry <= 60) {
          urgencyLevel = 'warning';
        } else {
          urgencyLevel = 'info';
        }

        return {
          ...cert,
          daysUntilExpiry,
          urgencyLevel
        };
      });

      setAlerts(processedAlerts);

      // Calculate stats
      const newStats = {
        critical: processedAlerts.filter(a => a.urgencyLevel === 'critical').length,
        warning: processedAlerts.filter(a => a.urgencyLevel === 'warning').length,
        info: processedAlerts.filter(a => a.urgencyLevel === 'info').length,
        total: processedAlerts.length
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching certificate alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch certificate alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerManualCheck = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('certificate-alerts');
      
      if (error) throw error;
      
      toast({
        title: "Manual Check Complete",
        description: `Found ${data?.total_alerts || 0} certificates requiring attention`,
      });
      
      // Refresh alerts after manual check
      await fetchCertificateAlerts();
      
    } catch (error) {
      console.error('Error triggering manual check:', error);
      toast({
        title: "Error",
        description: "Failed to trigger manual certificate check",
        variant: "destructive",
      });
    }
  };

  const filterAlerts = (urgency?: 'critical' | 'warning' | 'info', department?: string, employee?: string) => {
    let filtered = alerts;
    
    if (urgency) {
      filtered = filtered.filter(alert => alert.urgencyLevel === urgency);
    }
    
    if (department) {
      filtered = filtered.filter(alert => alert.employees.department?.id === department);
    }
    
    if (employee) {
      filtered = filtered.filter(alert => 
        alert.employees.name.toLowerCase().includes(employee.toLowerCase()) ||
        alert.employees.email.toLowerCase().includes(employee.toLowerCase())
      );
    }
    
    return filtered;
  };

  useEffect(() => {
    fetchCertificateAlerts();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchCertificateAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    loading,
    stats,
    filterAlerts,
    triggerManualCheck,
    refetch: fetchCertificateAlerts
  };
}