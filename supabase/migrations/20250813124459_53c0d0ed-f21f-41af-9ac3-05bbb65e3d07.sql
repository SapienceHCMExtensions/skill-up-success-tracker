-- Fix critical security vulnerability in evaluation_templates table
-- Remove the overly permissive policy that allows anyone to view templates
DROP POLICY IF EXISTS "Anyone can view evaluation templates" ON public.evaluation_templates;

-- Create secure RLS policies for evaluation_templates
-- Policy 1: Authenticated users can view evaluation templates for courses in their organization
CREATE POLICY "Authenticated users can view evaluation templates in org" 
ON public.evaluation_templates 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = evaluation_templates.course_id 
    AND c.organization_id = get_current_user_org()
    AND c.is_active = true
  )
  OR 
  -- Allow viewing templates not tied to specific courses (global templates)
  (course_id IS NULL AND is_active = true)
);

-- Policy 2: Managers and admins can manage evaluation templates for their org's courses
CREATE POLICY "Managers and admins can manage evaluation templates" 
ON public.evaluation_templates 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = evaluation_templates.course_id 
    AND (
      has_org_role(auth.uid(), 'admin'::app_role, c.organization_id) OR 
      has_org_role(auth.uid(), 'manager'::app_role, c.organization_id)
    )
  )
  OR 
  -- Allow managing global templates only for admins
  (course_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = evaluation_templates.course_id 
    AND (
      has_org_role(auth.uid(), 'admin'::app_role, c.organization_id) OR 
      has_org_role(auth.uid(), 'manager'::app_role, c.organization_id)
    )
  )
  OR 
  -- Allow creating global templates only for admins
  (course_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
);