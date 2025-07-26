-- Fix database function search paths
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_employee_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id
  FROM public.employees
  WHERE auth_user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Insert into employees table
    INSERT INTO public.employees (auth_user_id, name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email
    );
    
    -- Assign default employee role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee');
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_certificate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    course_cert_months INTEGER;
    expiry_date DATE;
BEGIN
    -- Only generate certificate when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Get certificate validity from course
        SELECT certificate_validity_months INTO course_cert_months
        FROM public.courses c
        JOIN public.sessions s ON s.course_id = c.id
        WHERE s.id = NEW.session_id;
        
        -- Calculate expiry date if certificate is valid
        IF course_cert_months > 0 THEN
            expiry_date := CURRENT_DATE + (course_cert_months || ' months')::INTERVAL;
        END IF;
        
        -- Insert certificate record
        INSERT INTO public.employee_certificates (
            employee_id,
            course_id,
            session_id,
            issue_date,
            expiry_date
        )
        SELECT 
            NEW.employee_id,
            s.course_id,
            NEW.session_id,
            CURRENT_DATE,
            expiry_date
        FROM public.sessions s
        WHERE s.id = NEW.session_id
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert security audit logs
CREATE POLICY "System can create security audit logs" 
ON public.security_audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Add critical RLS policy to prevent self-role escalation
CREATE POLICY "Users cannot update their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (
    -- Users cannot update their own roles - only admins can update any roles
    (auth.uid() != user_id) AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add policy to prevent users from deleting their own roles
CREATE POLICY "Users cannot delete their own roles" 
ON public.user_roles 
FOR DELETE 
USING (
    -- Users cannot delete their own roles - only admins can delete any roles
    (auth.uid() != user_id) AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Log role changes to security audit logs
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.security_audit_logs (
            event_type,
            user_id,
            details
        ) VALUES (
            'role_assigned',
            auth.uid(),
            jsonb_build_object(
                'target_user_id', NEW.user_id,
                'role_assigned', NEW.role,
                'operation', 'INSERT'
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.security_audit_logs (
            event_type,
            user_id,
            details
        ) VALUES (
            'role_modified',
            auth.uid(),
            jsonb_build_object(
                'target_user_id', NEW.user_id,
                'old_role', OLD.role,
                'new_role', NEW.role,
                'operation', 'UPDATE'
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.security_audit_logs (
            event_type,
            user_id,
            details
        ) VALUES (
            'role_removed',
            auth.uid(),
            jsonb_build_object(
                'target_user_id', OLD.user_id,
                'role_removed', OLD.role,
                'operation', 'DELETE'
            )
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS log_role_changes_trigger ON public.user_roles;
CREATE TRIGGER log_role_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_role_changes();

-- Create function to generate secure random passwords
CREATE OR REPLACE FUNCTION public.generate_secure_password(length INTEGER DEFAULT 16)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$;