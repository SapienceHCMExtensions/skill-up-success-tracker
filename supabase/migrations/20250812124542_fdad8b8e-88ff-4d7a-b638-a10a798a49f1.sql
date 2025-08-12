
-- 1) Courses: remove public SELECT, allow only authenticated users to view active courses
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;

CREATE POLICY "Authenticated can view active courses"
  ON public.courses
  FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- 2) Workflow definitions: remove public SELECT for active workflows; allow only manager/admin to view
DROP POLICY IF EXISTS "Anyone can view active workflow definitions" ON public.workflow_definitions;

CREATE POLICY "Managers and admins can view workflow definitions"
  ON public.workflow_definitions
  FOR SELECT
  USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'));

-- 3) Sessions: ensure only authenticated users can view
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.sessions;

CREATE POLICY "Authenticated users can view sessions"
  ON public.sessions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 4) Security audit logs: restrict INSERT to admins (edge functions using service role still bypass RLS)
DROP POLICY IF EXISTS "System can create security audit logs" ON public.security_audit_logs;

CREATE POLICY "Admins can create security audit logs"
  ON public.security_audit_logs
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));
