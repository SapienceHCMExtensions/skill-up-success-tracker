import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Info, ExternalLink, Mail } from "lucide-react";
import { format, parseISO } from 'date-fns';

type CertificateAlert = {
  id: string;
  expiry_date: string | null;
  issue_date: string;
  certificate_url: string | null;
  employees: {
    id: string;
    name: string;
    email: string;
    department?: {
      id: string;
      name: string;
    } | null;
  };
  courses: {
    id: string;
    title: string;
    code: string;
  };
  daysUntilExpiry: number;
  urgencyLevel: 'critical' | 'warning' | 'info';
};

interface AlertsTableProps {
  alerts: CertificateAlert[];
  isLoading?: boolean;
}

export function AlertsTable({ alerts, isLoading = false }: AlertsTableProps) {
  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getUrgencyBadge = (urgency: string, days: number) => {
    const variant = urgency === 'critical' ? 'destructive' : 
                   urgency === 'warning' ? 'secondary' : 'outline';
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getUrgencyIcon(urgency)}
        {days} days
      </Badge>
    );
  };

  const handleSendReminder = (email: string, employeeName: string, courseName: string, daysLeft: number) => {
    const subject = `Certificate Expiry Reminder - ${courseName}`;
    const body = `Hi ${employeeName},\n\nThis is a reminder that your certificate for "${courseName}" will expire in ${daysLeft} days.\n\nPlease take necessary action to renew your certification.\n\nBest regards,\nTraining Team`;
    
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-muted-foreground">
          Loading certificate alerts...
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-muted-foreground">
          No certificate alerts found.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Certificate</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{alert.employees.name}</div>
                  <div className="text-sm text-muted-foreground">{alert.employees.email}</div>
                </div>
              </TableCell>
              <TableCell>
                {alert.employees.department?.name || 'No Department'}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{alert.courses.title}</div>
                  <div className="text-sm text-muted-foreground">{alert.courses.code}</div>
                </div>
              </TableCell>
              <TableCell>
                {format(parseISO(alert.issue_date), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                {alert.expiry_date ? format(parseISO(alert.expiry_date), 'MMM dd, yyyy') : 'No expiry'}
              </TableCell>
              <TableCell>
                {getUrgencyBadge(alert.urgencyLevel, alert.daysUntilExpiry)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendReminder(
                      alert.employees.email,
                      alert.employees.name,
                      alert.courses.title,
                      alert.daysUntilExpiry
                    )}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  {alert.certificate_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(alert.certificate_url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}