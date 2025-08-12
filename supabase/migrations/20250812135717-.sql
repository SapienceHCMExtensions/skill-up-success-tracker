-- Complete multi-tenancy setup: finalize constraints, policies, and trigger idempotently

-- 1) Add constraints safely (only if missing)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='employees_organization_id_fkey') THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_roles_organization_id_fkey') THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_roles_unique_per_org') THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_unique_per_org UNIQUE (user_id, role, organization_id);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='departments_organization_id_fkey') THEN
    ALTER TABLE public.departments
      ADD CONSTRAINT departments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='organization_settings_organization_id_fkey') THEN
    ALTER TABLE public.organization_settings
      ADD CONSTRAINT organization_settings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='organization_settings_one_per_org') THEN
    ALTER TABLE public.organization_settings
      ADD CONSTRAINT organization_settings_one_per_org UNIQUE (organization_id);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='email_templates_organization_id_fkey') THEN
    ALTER TABLE public.email_templates
      ADD CONSTRAINT email_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='courses_organization_id_fkey') THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='plans_organization_id_fkey') THEN
    ALTER TABLE public.plans
      ADD CONSTRAINT plans_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='plan_modules_organization_id_fkey') THEN
    ALTER TABLE public.plan_modules
      ADD CONSTRAINT plan_modules_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='plan_resources_organization_id_fkey') THEN
    ALTER TABLE public.plan_resources
      ADD CONSTRAINT plan_resources_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='plan_trainers_organization_id_fkey') THEN
    ALTER TABLE public.plan_trainers
      ADD CONSTRAINT plan_trainers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='plan_employees_organization_id_fkey') THEN
    ALTER TABLE public.plan_employees
      ADD CONSTRAINT plan_employees_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='plan_evaluations_organization_id_fkey') THEN
    ALTER TABLE public.plan_evaluations
      ADD CONSTRAINT plan_evaluations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sessions_organization_id_fkey') THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='session_enrollments_organization_id_fkey') THEN
    ALTER TABLE public.session_enrollments
      ADD CONSTRAINT session_enrollments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='training_requests_organization_id_fkey') THEN
    ALTER TABLE public.training_requests
      ADD CONSTRAINT training_requests_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='course_cost_actuals_organization_id_fkey') THEN
    ALTER TABLE public.course_cost_actuals
      ADD CONSTRAINT course_cost_actuals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cost_actuals_organization_id_fkey') THEN
    ALTER TABLE public.cost_actuals
      ADD CONSTRAINT cost_actuals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='evaluation_responses_organization_id_fkey') THEN
    ALTER TABLE public.evaluation_responses
      ADD CONSTRAINT evaluation_responses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='course_evaluation_responses_organization_id_fkey') THEN
    ALTER TABLE public.course_evaluation_responses
      ADD CONSTRAINT course_evaluation_responses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='external_trainers_organization_id_fkey') THEN
    ALTER TABLE public.external_trainers
      ADD CONSTRAINT external_trainers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='training_vendors_organization_id_fkey') THEN
    ALTER TABLE public.training_vendors
      ADD CONSTRAINT training_vendors_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='training_audit_organization_id_fkey') THEN
    ALTER TABLE public.training_audit
      ADD CONSTRAINT training_audit_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='security_audit_logs_organization_id_fkey') THEN
    ALTER TABLE public.security_audit_logs
      ADD CONSTRAINT security_audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_definitions_organization_id_fkey') THEN
    ALTER TABLE public.workflow_definitions
      ADD CONSTRAINT workflow_definitions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_instances_organization_id_fkey') THEN
    ALTER TABLE public.workflow_instances
      ADD CONSTRAINT workflow_instances_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_tasks_organization_id_fkey') THEN
    ALTER TABLE public.workflow_tasks
      ADD CONSTRAINT workflow_tasks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_instance_events_organization_id_fkey') THEN
    ALTER TABLE public.workflow_instance_events
      ADD CONSTRAINT workflow_instance_events_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='employee_certificates_organization_id_fkey') THEN
    ALTER TABLE public.employee_certificates
      ADD CONSTRAINT employee_certificates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 2) Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_departments_org ON public.departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_settings_org ON public.organization_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON public.email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_courses_org ON public.courses(organization_id);
CREATE INDEX IF NOT EXISTS idx_plans_org ON public.plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_plan_modules_org ON public.plan_modules(organization_id);
CREATE INDEX IF NOT EXISTS idx_plan_resources_org ON public.plan_resources(organization_id);
CREATE INDEX IF NOT EXISTS idx_plan_trainers_org ON public.plan_trainers(organization_id);
CREATE INDEX IF NOT EXISTS idx_plan_employees_org ON public.plan_employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_plan_evaluations_org ON public.plan_evaluations(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org ON public.sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_org ON public.session_enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_requests_org ON public.training_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_course_cost_actuals_org ON public.course_cost_actuals(organization_id);
CREATE INDEX IF NOT EXISTS idx_cost_actuals_org ON public.cost_actuals(organization_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_responses_org ON public.evaluation_responses(organization_id);
CREATE INDEX IF NOT EXISTS idx_course_eval_responses_org ON public.course_evaluation_responses(organization_id);
CREATE INDEX IF NOT EXISTS idx_external_trainers_org ON public.external_trainers(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_vendors_org ON public.training_vendors(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_audit_org ON public.training_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_org ON public.security_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_org ON public.workflow_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_org ON public.workflow_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_org ON public.workflow_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instance_events_org ON public.workflow_instance_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_certificates_org ON public.employee_certificates(organization_id);

-- 3) Ensure helper functions exist
CREATE OR REPLACE FUNCTION public.get_current_user_org()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _role app_role, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND organization_id = _org_id
  )
$$;

-- 4) Re-apply RLS policies (drop then create)
-- Organizations
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage their organization" ON public.organizations;
CREATE POLICY "Users can view their organization"
ON public.organizations FOR SELECT
USING (id = public.get_current_user_org());
CREATE POLICY "Admins can manage their organization"
ON public.organizations FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', id));

-- Employees
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Managers and admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
CREATE POLICY "Admins can manage employees" ON public.employees FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Managers and admins can view all employees" ON public.employees FOR SELECT
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Users can view their own employee record" ON public.employees FOR SELECT
USING (auth.uid() = auth_user_id AND organization_id = public.get_current_user_org());

-- User roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot delete their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot update their own roles" ON public.user_roles;
CREATE POLICY "Admins can manage org roles" ON public.user_roles FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Users can view their own roles in org" ON public.user_roles FOR SELECT
USING (user_id = auth.uid() AND organization_id = public.get_current_user_org());
CREATE POLICY "Admins only can delete roles in org" ON public.user_roles FOR DELETE
USING (public.has_org_role(auth.uid(), 'admin', organization_id) AND auth.uid() <> user_id);
CREATE POLICY "Admins only can update roles in org" ON public.user_roles FOR UPDATE
USING (public.has_org_role(auth.uid(), 'admin', organization_id) AND auth.uid() <> user_id)
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

-- Departments
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Org users can view departments" ON public.departments;
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Org users can view departments" ON public.departments FOR SELECT
USING (organization_id = public.get_current_user_org());

-- Organization settings
DROP POLICY IF EXISTS "Admins can manage org settings" ON public.organization_settings;
CREATE POLICY "Admins can manage org settings" ON public.organization_settings FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

-- Email templates
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

-- Courses
DROP POLICY IF EXISTS "Admins and managers can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated can view active courses" ON public.courses;
CREATE POLICY "Admins and managers can manage courses" ON public.courses FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id));
CREATE POLICY "Authenticated can view active courses in org" ON public.courses FOR SELECT
USING (is_active = true AND organization_id = public.get_current_user_org() AND auth.uid() IS NOT NULL);

-- Plans and children
DROP POLICY IF EXISTS "Managers and admins can manage plans" ON public.plans;
DROP POLICY IF EXISTS "Managers and admins can view plans" ON public.plans;
CREATE POLICY "Managers and admins can manage plans" ON public.plans FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Managers and admins can view plans" ON public.plans FOR SELECT
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Managers and admins can manage plan modules" ON public.plan_modules;
CREATE POLICY "Managers and admins can manage plan modules" ON public.plan_modules FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Managers and admins can manage plan resources" ON public.plan_resources;
CREATE POLICY "Managers and admins can manage plan resources" ON public.plan_resources FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Managers and admins can manage plan trainers" ON public.plan_trainers;
CREATE POLICY "Managers and admins can manage plan trainers" ON public.plan_trainers FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Managers and admins can manage plan employees" ON public.plan_employees;
DROP POLICY IF EXISTS "Users can view their own plan assignments" ON public.plan_employees;
CREATE POLICY "Managers and admins can manage plan employees" ON public.plan_employees FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Users can view their own plan assignments" ON public.plan_employees FOR SELECT
USING (employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org());

DROP POLICY IF EXISTS "Managers and admins can manage plan evaluations" ON public.plan_evaluations;
CREATE POLICY "Managers and admins can manage plan evaluations" ON public.plan_evaluations FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

-- Sessions & enrollments
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Managers, instructors and admins can manage sessions" ON public.sessions;
CREATE POLICY "Authenticated users can view sessions in org" ON public.sessions FOR SELECT
USING (auth.uid() IS NOT NULL AND organization_id = public.get_current_user_org());
CREATE POLICY "Managers, instructors and admins can manage sessions" ON public.sessions FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id));

DROP POLICY IF EXISTS "Managers and instructors can manage enrollments" ON public.session_enrollments;
DROP POLICY IF EXISTS "Managers and instructors can view enrollments" ON public.session_enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.session_enrollments;
CREATE POLICY "Managers and instructors can manage enrollments" ON public.session_enrollments FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Managers and instructors can view enrollments" ON public.session_enrollments FOR SELECT
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Users can view their own enrollments" ON public.session_enrollments FOR SELECT
USING (employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org());

-- Training requests
DROP POLICY IF EXISTS "Employees can create training requests" ON public.training_requests;
DROP POLICY IF EXISTS "Employees can view their own training requests" ON public.training_requests;
DROP POLICY IF EXISTS "Managers and admins can update training requests" ON public.training_requests;
CREATE POLICY "Employees can create training requests" ON public.training_requests FOR INSERT
WITH CHECK ((requested_by = public.get_employee_id(auth.uid()) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)) AND organization_id = public.get_current_user_org());
CREATE POLICY "Employees can view their own training requests" ON public.training_requests FOR SELECT
USING (organization_id = public.get_current_user_org() AND (employee_id = public.get_employee_id(auth.uid()) OR requested_by = public.get_employee_id(auth.uid()) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)));
CREATE POLICY "Managers and admins can update training requests" ON public.training_requests FOR UPDATE
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id) OR ((requested_by = public.get_employee_id(auth.uid())) AND (status IN ('draft','rejected'))));

-- Costs
DROP POLICY IF EXISTS "Finance and admin can manage costs" ON public.cost_actuals;
CREATE POLICY "Finance and admin can manage org costs" ON public.cost_actuals FOR ALL
USING (public.has_org_role(auth.uid(), 'finance', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'finance', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Employees can submit their own course expenses" ON public.course_cost_actuals;
DROP POLICY IF EXISTS "Employees can update their pending expenses" ON public.course_cost_actuals;
DROP POLICY IF EXISTS "Employees can view their own course expenses" ON public.course_cost_actuals;
DROP POLICY IF EXISTS "Finance and managers can manage course expenses" ON public.course_cost_actuals;
DROP POLICY IF EXISTS "Finance and managers can view all course expenses" ON public.course_cost_actuals;
CREATE POLICY "Employees can submit their own course expenses" ON public.course_cost_actuals FOR INSERT
WITH CHECK (employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org());
CREATE POLICY "Employees can update their pending expenses" ON public.course_cost_actuals FOR UPDATE
USING (employee_id = public.get_employee_id(auth.uid()) AND status = 'pending' AND organization_id = public.get_current_user_org());
CREATE POLICY "Employees can view their own course expenses" ON public.course_cost_actuals FOR SELECT
USING (employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org());
CREATE POLICY "Finance and managers can manage course expenses" ON public.course_cost_actuals FOR ALL
USING (public.has_org_role(auth.uid(), 'finance', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'finance', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Finance and managers can view all course expenses" ON public.course_cost_actuals FOR SELECT
USING (public.has_org_role(auth.uid(), 'finance', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

-- Evaluations
DROP POLICY IF EXISTS "Managers can view all evaluation responses" ON public.evaluation_responses;
DROP POLICY IF EXISTS "Users can submit their own evaluations" ON public.evaluation_responses;
DROP POLICY IF EXISTS "Users can view their own evaluation responses" ON public.evaluation_responses;
CREATE POLICY "Managers can view all evaluation responses" ON public.evaluation_responses FOR SELECT
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Users can submit their own evaluations" ON public.evaluation_responses FOR INSERT
WITH CHECK (employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org());
CREATE POLICY "Users can view their own evaluation responses" ON public.evaluation_responses FOR SELECT
USING (employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org());

DROP POLICY IF EXISTS "Managers can view all course evaluation responses" ON public.course_evaluation_responses;
DROP POLICY IF EXISTS "Users can submit their own course evaluations" ON public.course_evaluation_responses;
DROP POLICY IF EXISTS "Users can view their own course evaluation responses" ON public.course_evaluation_responses;
CREATE POLICY "Managers can view all course evaluation responses" ON public.course_evaluation_responses FOR SELECT
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Users can submit their own course evaluations" ON public.course_evaluation_responses FOR INSERT
WITH CHECK (employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org());
CREATE POLICY "Users can view their own course evaluation responses" ON public.course_evaluation_responses FOR SELECT
USING (employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org());

-- Trainers/vendors
DROP POLICY IF EXISTS "Managers and admins can manage external trainers" ON public.external_trainers;
DROP POLICY IF EXISTS "Privileged roles can view external trainers" ON public.external_trainers;
CREATE POLICY "Managers and admins can manage external trainers" ON public.external_trainers FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Privileged roles can view external trainers" ON public.external_trainers FOR SELECT
USING ((public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id)) AND is_active = true);

DROP POLICY IF EXISTS "Anyone can view active approved vendors" ON public.training_vendors;
DROP POLICY IF EXISTS "Managers and admins can manage vendors" ON public.training_vendors;
CREATE POLICY "Anyone can view active approved vendors in org" ON public.training_vendors FOR SELECT
USING (is_active = true AND is_approved = true AND organization_id = public.get_current_user_org());
CREATE POLICY "Managers and admins can manage vendors" ON public.training_vendors FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

-- Audit/logs
DROP POLICY IF EXISTS "Admins can create security audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Admins can view security audit logs" ON public.security_audit_logs;
CREATE POLICY "Admins can create security audit logs" ON public.security_audit_logs FOR INSERT
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Admins can view security audit logs" ON public.security_audit_logs FOR SELECT
USING (public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.training_audit;
CREATE POLICY "Admins can view audit logs" ON public.training_audit FOR SELECT
USING (public.has_org_role(auth.uid(), 'admin', organization_id));

-- Workflow
DROP POLICY IF EXISTS "Managers and admins can manage workflow definitions" ON public.workflow_definitions;
DROP POLICY IF EXISTS "Managers and admins can view workflow definitions" ON public.workflow_definitions;
CREATE POLICY "Managers and admins can manage workflow definitions" ON public.workflow_definitions FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Managers and admins can view workflow definitions" ON public.workflow_definitions FOR SELECT
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Managers and admins can manage workflow instances" ON public.workflow_instances;
DROP POLICY IF EXISTS "Managers and admins can view workflow instances" ON public.workflow_instances;
CREATE POLICY "Managers and admins can manage workflow instances" ON public.workflow_instances FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Managers and admins can view workflow instances" ON public.workflow_instances FOR SELECT
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Managers and admins can insert workflow events" ON public.workflow_instance_events;
DROP POLICY IF EXISTS "Managers and admins can view workflow events" ON public.workflow_instance_events;
CREATE POLICY "Managers and admins can insert workflow events" ON public.workflow_instance_events FOR INSERT
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Managers and admins can view workflow events" ON public.workflow_instance_events FOR SELECT
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Managers and admins can manage workflow tasks" ON public.workflow_tasks;
DROP POLICY IF EXISTS "Users can update their assigned tasks" ON public.workflow_tasks;
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON public.workflow_tasks;
CREATE POLICY "Managers and admins can manage workflow tasks" ON public.workflow_tasks FOR ALL
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Users can update their assigned tasks" ON public.workflow_tasks FOR UPDATE
USING (assigned_to_user = auth.uid() AND organization_id = public.get_current_user_org())
WITH CHECK (assigned_to_user = auth.uid() AND organization_id = public.get_current_user_org());
CREATE POLICY "Users can view their assigned tasks" ON public.workflow_tasks FOR SELECT
USING (assigned_to_user = auth.uid() AND organization_id = public.get_current_user_org());

-- Certificates
DROP POLICY IF EXISTS "Managers and compliance can view certificates" ON public.employee_certificates;
DROP POLICY IF EXISTS "System can create certificates" ON public.employee_certificates;
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.employee_certificates;
CREATE POLICY "Managers and compliance can view certificates" ON public.employee_certificates FOR SELECT
USING (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'compliance', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "System can create certificates" ON public.employee_certificates FOR INSERT
WITH CHECK (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id));
CREATE POLICY "Users can view their own certificates" ON public.employee_certificates FOR SELECT
USING (employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org());

-- 5) Update signup trigger (idempotent)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  org_id uuid;
  created_new_org boolean := false;
  meta jsonb := NEW.raw_user_meta_data;
  meta_subdomain text := lower(COALESCE(meta->>'subdomain', ''));
  meta_org_name text := COALESCE(meta->>'org_name', '');
BEGIN
  IF meta_subdomain IS NOT NULL AND meta_subdomain <> '' THEN
    SELECT id INTO org_id FROM public.organizations WHERE subdomain = meta_subdomain;
    IF org_id IS NULL THEN
      IF meta_org_name = '' THEN meta_org_name := split_part(NEW.email, '@', 2); END IF;
      INSERT INTO public.organizations(name, subdomain) VALUES (meta_org_name, meta_subdomain) RETURNING id INTO org_id;
      created_new_org := true;
    END IF;
  END IF;

  IF org_id IS NULL THEN
    SELECT id INTO org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
    IF org_id IS NULL THEN
      INSERT INTO public.organizations(name, subdomain) VALUES ('Default Organization','default') RETURNING id INTO org_id;
      created_new_org := true;
    END IF;
  END IF;

  INSERT INTO public.employees (auth_user_id, name, email, organization_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email, org_id);

  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, 'employee', org_id)
  ON CONFLICT DO NOTHING;

  IF created_new_org THEN
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (NEW.id, 'admin', org_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END$$;