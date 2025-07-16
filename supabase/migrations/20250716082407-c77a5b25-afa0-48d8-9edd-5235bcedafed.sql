-- Redesign evaluations to be course-based instead of session-based
-- First, create new course-based evaluation responses table
CREATE TABLE public.course_evaluation_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id),
  course_id UUID REFERENCES public.courses(id),
  template_id UUID REFERENCES public.evaluation_templates(id),
  responses JSONB NOT NULL,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  training_request_id UUID REFERENCES public.training_requests(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on course evaluations
ALTER TABLE public.course_evaluation_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for course evaluations
CREATE POLICY "Users can submit their own course evaluations" 
ON public.course_evaluation_responses 
FOR INSERT 
WITH CHECK (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can view their own course evaluation responses" 
ON public.course_evaluation_responses 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Managers can view all course evaluation responses" 
ON public.course_evaluation_responses 
FOR SELECT 
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Redesign cost tracking to be course-based and training request-based
CREATE TABLE public.course_cost_actuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id),
  training_request_id UUID REFERENCES public.training_requests(id),
  employee_id UUID REFERENCES public.employees(id),
  amount NUMERIC NOT NULL,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('training_fee', 'travel', 'accommodation', 'materials', 'other')),
  description TEXT,
  receipt_url TEXT,
  invoice_no TEXT,
  expense_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
  recorded_by UUID REFERENCES public.employees(id),
  approved_by UUID REFERENCES public.employees(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on course cost actuals
ALTER TABLE public.course_cost_actuals ENABLE ROW LEVEL SECURITY;

-- Create policies for course cost actuals
CREATE POLICY "Employees can submit their own course expenses" 
ON public.course_cost_actuals 
FOR INSERT 
WITH CHECK (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Employees can view their own course expenses" 
ON public.course_cost_actuals 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Employees can update their pending expenses" 
ON public.course_cost_actuals 
FOR UPDATE 
USING (employee_id = get_employee_id(auth.uid()) AND status = 'pending');

CREATE POLICY "Finance and managers can view all course expenses" 
ON public.course_cost_actuals 
FOR SELECT 
USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Finance and managers can manage course expenses" 
ON public.course_cost_actuals 
FOR ALL 
USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add expense tracking fields to training requests
ALTER TABLE public.training_requests 
ADD COLUMN total_approved_cost NUMERIC DEFAULT 0,
ADD COLUMN total_actual_cost NUMERIC DEFAULT 0,
ADD COLUMN expense_status TEXT DEFAULT 'not_submitted' CHECK (expense_status IN ('not_submitted', 'partial', 'submitted', 'approved', 'reimbursed'));

-- Create trigger to update training request costs when course costs are updated
CREATE OR REPLACE FUNCTION public.update_training_request_costs()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total actual cost for the training request
  UPDATE public.training_requests 
  SET 
    total_actual_cost = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.course_cost_actuals 
      WHERE training_request_id = COALESCE(NEW.training_request_id, OLD.training_request_id)
      AND status IN ('approved', 'reimbursed')
    ),
    expense_status = CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.course_cost_actuals 
        WHERE training_request_id = COALESCE(NEW.training_request_id, OLD.training_request_id)
        AND status = 'reimbursed'
      ) THEN 'reimbursed'
      WHEN EXISTS (
        SELECT 1 FROM public.course_cost_actuals 
        WHERE training_request_id = COALESCE(NEW.training_request_id, OLD.training_request_id)
        AND status = 'approved'
      ) THEN 'approved'
      WHEN EXISTS (
        SELECT 1 FROM public.course_cost_actuals 
        WHERE training_request_id = COALESCE(NEW.training_request_id, OLD.training_request_id)
      ) THEN 'submitted'
      ELSE 'not_submitted'
    END
  WHERE id = COALESCE(NEW.training_request_id, OLD.training_request_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_training_request_costs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.course_cost_actuals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_training_request_costs();

-- Add updated_at trigger for course_cost_actuals
CREATE TRIGGER update_course_cost_actuals_updated_at
  BEFORE UPDATE ON public.course_cost_actuals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert comprehensive translations for the new functionality
INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'course_evaluation_responses',
  'Course Evaluation Responses',
  'tables'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'course_cost_actuals',
  'Course Cost Actuals',
  'tables'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'expense_management',
  'Expense Management',
  'navigation'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'submit_expense',
  'Submit Expense',
  'actions'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'expense_type',
  'Expense Type',
  'forms'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'training_fee',
  'Training Fee',
  'expense_types'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'travel_expenses',
  'Travel Expenses',
  'expense_types'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'accommodation',
  'Accommodation',
  'expense_types'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'materials',
  'Materials',
  'expense_types'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'receipt_upload',
  'Receipt Upload',
  'forms'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'expense_status',
  'Expense Status',
  'forms'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'pending_approval',
  'Pending Approval',
  'status'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'approved',
  'Approved',
  'status'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'rejected',
  'Rejected',
  'status'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'reimbursed',
  'Reimbursed',
  'status'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'course_evaluation',
  'Course Evaluation',
  'forms'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'overall_course_rating',
  'Overall Course Rating',
  'forms'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'course_effectiveness',
  'Course Effectiveness',
  'forms'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'learning_objectives_met',
  'Learning Objectives Met',
  'forms'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'expense_date',
  'Expense Date',
  'forms'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'total_actual_cost',
  'Total Actual Cost',
  'forms'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;

INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT 
  l.id,
  'expense_management_dashboard',
  'Expense Management Dashboard',
  'navigation'
FROM public.languages l WHERE l.code = 'en' AND l.is_active = true;