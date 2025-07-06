-- Temporarily update your user role to admin for testing
-- Replace 'your-email@example.com' with your actual email
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = (
  SELECT auth_user_id 
  FROM public.employees 
  WHERE email = 'your-email@example.com'
  LIMIT 1
);