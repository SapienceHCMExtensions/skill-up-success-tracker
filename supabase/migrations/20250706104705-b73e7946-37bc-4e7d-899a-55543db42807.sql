-- Update user role to admin based on email from auth logs
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = (
  SELECT auth_user_id 
  FROM public.employees 
  WHERE email = 'kannan.srinivasan.at@outlook.com'
  LIMIT 1
);