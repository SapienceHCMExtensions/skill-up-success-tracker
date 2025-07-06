-- Fix the generate_certificate function to have an immutable search_path
CREATE OR REPLACE FUNCTION public.generate_certificate()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;