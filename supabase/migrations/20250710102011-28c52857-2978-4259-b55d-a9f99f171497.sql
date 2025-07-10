-- Fix the log_training_request_changes function to have proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';