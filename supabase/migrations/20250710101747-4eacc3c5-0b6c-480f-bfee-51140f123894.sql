-- Create enum for training request status
CREATE TYPE public.training_request_status AS ENUM (
  'draft',
  'pending_approval', 
  'approved',
  'rejected',
  'in_progress',
  'completed',
  'cancelled'
);

-- Create enum for trainer types  
CREATE TYPE public.trainer_type AS ENUM ('internal', 'external');

-- Create enum for vendor types
CREATE TYPE public.vendor_type AS ENUM ('individual', 'company');

-- Create training_requests table
CREATE TABLE public.training_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  training_provider TEXT, -- External provider name if not using existing course
  training_date DATE,
  estimated_cost NUMERIC DEFAULT 0,
  justification TEXT NOT NULL, -- Why this training is needed
  status training_request_status DEFAULT 'draft',
  requested_by UUID NOT NULL REFERENCES public.employees(id),
  approved_by UUID REFERENCES public.employees(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  approval_comment TEXT,
  certificate_url TEXT,
  expense_claim_id UUID, -- Will link to expense module later
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create training_workflow_logs table to track all status changes
CREATE TABLE public.training_workflow_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_request_id UUID NOT NULL REFERENCES public.training_requests(id) ON DELETE CASCADE,
  previous_status training_request_status,
  new_status training_request_status NOT NULL,
  action_taken TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.employees(id),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create external_trainers table
CREATE TABLE public.external_trainers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trainer_type trainer_type DEFAULT 'internal'::trainer_type,
  organization TEXT,
  email TEXT,
  phone TEXT,
  expertise_areas TEXT[],
  bio TEXT,
  hourly_rate NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create training_vendors table
CREATE TABLE public.training_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  vendor_type vendor_type DEFAULT 'company'::vendor_type,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  category_tags TEXT[],
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_training_requests_employee_id ON public.training_requests(employee_id);
CREATE INDEX idx_training_requests_status ON public.training_requests(status);
CREATE INDEX idx_training_requests_requested_by ON public.training_requests(requested_by);
CREATE INDEX idx_training_workflow_logs_request_id ON public.training_workflow_logs(training_request_id);
CREATE INDEX idx_external_trainers_active ON public.external_trainers(is_active);
CREATE INDEX idx_training_vendors_active ON public.training_vendors(is_active);

-- Enable RLS on all tables
ALTER TABLE public.training_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_vendors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_requests
CREATE POLICY "Employees can view their own training requests"
ON public.training_requests FOR SELECT
USING (
  employee_id = get_employee_id(auth.uid()) OR 
  requested_by = get_employee_id(auth.uid()) OR
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Employees can create training requests"
ON public.training_requests FOR INSERT
WITH CHECK (
  requested_by = get_employee_id(auth.uid()) OR
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Managers and admins can update training requests"
ON public.training_requests FOR UPDATE
USING (
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'admin') OR
  (requested_by = get_employee_id(auth.uid()) AND status IN ('draft', 'rejected'))
);

-- RLS Policies for training_workflow_logs
CREATE POLICY "Users can view workflow logs for accessible requests"
ON public.training_workflow_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.training_requests tr 
    WHERE tr.id = training_request_id 
    AND (
      tr.employee_id = get_employee_id(auth.uid()) OR 
      tr.requested_by = get_employee_id(auth.uid()) OR
      has_role(auth.uid(), 'manager') OR 
      has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "System can create workflow logs"
ON public.training_workflow_logs FOR INSERT
WITH CHECK (true); -- Allow system to log all changes

-- RLS Policies for external_trainers
CREATE POLICY "Anyone can view active external trainers"
ON public.external_trainers FOR SELECT
USING (is_active = true);

CREATE POLICY "Managers and admins can manage external trainers"
ON public.external_trainers FOR ALL
USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for training_vendors
CREATE POLICY "Anyone can view active approved vendors"
ON public.training_vendors FOR SELECT
USING (is_active = true AND is_approved = true);

CREATE POLICY "Managers and admins can manage vendors"
ON public.training_vendors FOR ALL
USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'));

-- Add trigger to automatically create workflow logs when training request status changes
CREATE OR REPLACE FUNCTION public.log_training_request_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status has changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.training_workflow_logs (
      training_request_id,
      previous_status,
      new_status,
      action_taken,
      user_id,
      comment
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      CASE 
        WHEN NEW.status = 'pending_approval' THEN 'Training request submitted for approval'
        WHEN NEW.status = 'approved' THEN 'Training request approved'
        WHEN NEW.status = 'rejected' THEN 'Training request rejected'
        WHEN NEW.status = 'in_progress' THEN 'Training started'
        WHEN NEW.status = 'completed' THEN 'Training completed'
        WHEN NEW.status = 'cancelled' THEN 'Training cancelled'
        ELSE 'Status updated to ' || NEW.status
      END,
      COALESCE(NEW.approved_by, NEW.requested_by),
      NEW.approval_comment
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for training request status changes
CREATE TRIGGER training_request_status_change_log
  AFTER UPDATE ON public.training_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_training_request_changes();

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_training_requests_updated_at
  BEFORE UPDATE ON public.training_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_external_trainers_updated_at
  BEFORE UPDATE ON public.external_trainers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_vendors_updated_at
  BEFORE UPDATE ON public.training_vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();