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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, DollarSign } from "lucide-react";
import { format } from 'date-fns';
import { useState } from 'react';
import type { Tables } from '@/integrations/supabase/types';

type CostActual = Tables<'cost_actuals'> & {
  session?: Tables<'sessions'> & {
    course?: Tables<'courses'>;
    plan?: Tables<'plans'>;
  };
};

interface CostActualsTableProps {
  costActuals: CostActual[];
  isLoading?: boolean;
}

export function CostActualsTable({ costActuals, isLoading = false }: CostActualsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filteredCosts = costActuals.filter(cost => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cost.description?.toLowerCase().includes(searchLower) ||
      cost.invoice_no?.toLowerCase().includes(searchLower) ||
      cost.session?.title?.toLowerCase().includes(searchLower) ||
      cost.session?.course?.title?.toLowerCase().includes(searchLower) ||
      cost.session?.plan?.name?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cost Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">
            Loading cost records...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Cost Records
        </CardTitle>
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search costs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCosts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchTerm ? 'No cost records match your search.' : 'No cost records found.'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Training Session</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      {cost.recorded_at 
                        ? format(new Date(cost.recorded_at), 'MMM dd, yyyy')
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cost.session?.title || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                          {cost.session?.course?.title}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cost.session?.plan?.name ? (
                        <Badge variant="outline">{cost.session.plan.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">No plan</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-primary">
                        {formatCurrency(cost.amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cost.invoice_no ? (
                        <Badge variant="secondary">{cost.invoice_no}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={cost.description || ''}>
                        {cost.description || (
                          <span className="text-muted-foreground">No description</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {cost.invoice_no && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Could open invoice or redirect to external system
                              console.log('View invoice:', cost.invoice_no);
                            }}
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
        )}
      </CardContent>
    </Card>
  );
}