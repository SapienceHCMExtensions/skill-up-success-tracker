-- Fix remaining functions that need search_path set
CREATE OR REPLACE FUNCTION public.log_training_request_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_training_request_costs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
$$;