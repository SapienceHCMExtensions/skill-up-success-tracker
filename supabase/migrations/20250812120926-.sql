-- Restrict public access to external_trainers
-- 1) Drop overly-permissive public view policy
DROP POLICY IF EXISTS "Anyone can view active external trainers" ON public.external_trainers;

-- 2) Ensure RLS remains enabled (no-op if already enabled)
ALTER TABLE public.external_trainers ENABLE ROW LEVEL SECURITY;

-- 3) Add a restricted SELECT policy for privileged roles
CREATE POLICY "Privileged roles can view external trainers"
ON public.external_trainers
FOR SELECT
USING (
  (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructor'))
  AND is_active = true
);

-- Keep existing manage policy as-is, but recreate defensively to ensure it's present and accurate
DROP POLICY IF EXISTS "Managers and admins can manage external trainers" ON public.external_trainers;
CREATE POLICY "Managers and admins can manage external trainers"
ON public.external_trainers
FOR ALL
USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'));