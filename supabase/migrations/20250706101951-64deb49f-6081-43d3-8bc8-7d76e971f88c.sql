-- Add RLS policies for plan_employees table
-- Managers and admins can manage all plan employee assignments
CREATE POLICY "Managers and admins can manage plan employees" 
ON public.plan_employees 
FOR ALL 
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own plan assignments
CREATE POLICY "Users can view their own plan assignments" 
ON public.plan_employees 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));