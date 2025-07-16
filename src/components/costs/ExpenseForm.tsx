import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCourseExpenses } from '@/hooks/useCourseExpenses';
import { useCourses } from '@/hooks/useCourses';
import { useTrainingRequests } from '@/hooks/useTrainingRequests';

interface ExpenseFormData {
  course_id?: string;
  training_request_id?: string;
  amount: number;
  cost_type: string;
  description?: string;
  receipt_url?: string;
  invoice_no?: string;
  expense_date?: string;
}

export function ExpenseForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createExpense } = useCourseExpenses();
  const { courses } = useCourses();
  const { requests } = useTrainingRequests();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      expense_date: new Date().toISOString().split('T')[0]
    }
  });

  const selectedTrainingRequest = watch('training_request_id');

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      await createExpense(data);
      reset();
    } catch (error) {
      console.error('Error submitting expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const costTypes = [
    { value: 'training_fee', label: 'Training Fee' },
    { value: 'travel', label: 'Travel Expenses' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'materials', label: 'Materials' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Training Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="training_request">Training Request (Optional)</Label>
              <Select onValueChange={(value) => setValue('training_request_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select training request" />
                </SelectTrigger>
                <SelectContent>
                  {requests.map((request) => (
                    <SelectItem key={request.id} value={request.id}>
                      {request.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Select onValueChange={(value) => setValue('course_id', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course_id && (
                <span className="text-sm text-destructive">Course is required</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_type">Expense Type</Label>
              <Select onValueChange={(value) => setValue('cost_type', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {costTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cost_type && (
                <span className="text-sm text-destructive">Expense type is required</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
              />
              {errors.amount && (
                <span className="text-sm text-destructive">{errors.amount.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_date">Expense Date</Label>
              <Input
                id="expense_date"
                type="date"
                {...register('expense_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_no">Invoice/Receipt Number</Label>
              <Input
                id="invoice_no"
                {...register('invoice_no')}
                placeholder="Enter invoice or receipt number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Provide details about the expense..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_url">Receipt URL (Optional)</Label>
            <Input
              id="receipt_url"
              type="url"
              {...register('receipt_url')}
              placeholder="https://example.com/receipt.pdf"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}