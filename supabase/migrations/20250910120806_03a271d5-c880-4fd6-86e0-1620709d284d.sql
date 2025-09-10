-- Add additional employee fields from Sapience HCM
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employee_code text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS hire_date date;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS department_name text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS full_name_on_card text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS sapience_employee_id text;

-- Add index on sapience_employee_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_sapience_id ON public.employees(sapience_employee_id);