-- Insert sample departments for the training system
INSERT INTO public.departments (name) VALUES 
  ('Human Resources'),
  ('Information Technology'),
  ('Finance'),
  ('Operations'),
  ('Sales & Marketing'),
  ('Engineering'),
  ('Customer Support')
ON CONFLICT DO NOTHING;