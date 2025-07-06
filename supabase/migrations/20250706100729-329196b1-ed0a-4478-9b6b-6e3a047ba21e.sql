-- Fix the get_employee_id function to have an immutable search_path
CREATE OR REPLACE FUNCTION public.get_employee_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT id
  FROM public.employees
  WHERE auth_user_id = _user_id
  LIMIT 1
$function$;