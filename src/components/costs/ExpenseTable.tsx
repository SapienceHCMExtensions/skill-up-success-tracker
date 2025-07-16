import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCourseExpenses } from '@/hooks/useCourseExpenses';
import { CheckCircle, XCircle, Clock, DollarSign, Search } from 'lucide-react';

export function ExpenseTable() {
  const { expenses, loading, updateExpenseStatus } = useCourseExpenses();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.cost_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'reimbursed':
        return <Badge variant="outline" className="text-blue-600"><DollarSign className="w-3 h-3 mr-1" />Reimbursed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCostTypeLabel = (costType: string) => {
    const labels: Record<string, string> = {
      'training_fee': 'Training Fee',
      'travel': 'Travel',
      'accommodation': 'Accommodation',
      'materials': 'Materials',
      'other': 'Other'
    };
    return labels[costType] || costType;
  };

  if (loading) {
    return <div>Loading expenses...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Records</CardTitle>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="reimbursed">Reimbursed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{expense.employee?.name}</div>
                    <div className="text-sm text-muted-foreground">{expense.employee?.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{expense.course?.title}</div>
                    <div className="text-sm text-muted-foreground">{expense.course?.code}</div>
                  </div>
                </TableCell>
                <TableCell>{getCostTypeLabel(expense.cost_type)}</TableCell>
                <TableCell>${expense.amount?.toLocaleString()}</TableCell>
                <TableCell>
                  {expense.expense_date && new Date(expense.expense_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{getStatusBadge(expense.status || 'pending')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {expense.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateExpenseStatus(expense.id, 'approved')}
                          className="text-green-600 hover:text-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateExpenseStatus(expense.id, 'rejected')}
                          className="text-red-600 hover:text-red-700"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {expense.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateExpenseStatus(expense.id, 'reimbursed')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Mark Reimbursed
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No expenses found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}