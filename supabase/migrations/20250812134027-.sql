-- Multi-tenancy migration
-- 1) Create organizations table and helper functions

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's organization
CREATE OR REPLACE FUNCTION public.get_current_user_org()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id
  FROM public.employees
  WHERE auth_user_id = auth.uid()
  LIMIT 1
$$;

-- Helper: org-scoped role check
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _role app_role, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND organization_id = _org_id
  )
$$;

-- Basic policies for organizations
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage their organization" ON public.organizations;
CREATE POLICY "Users can view their organization"
ON public.organizations
FOR SELECT
USING (id = public.get_current_user_org());

CREATE POLICY "Admins can manage their organization"
ON public.organizations
FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', id));

-- Insert a default organization if none exists
DO $$
DECLARE
  existing_count integer;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM public.organizations;
  IF existing_count = 0 THEN
    INSERT INTO public.organizations (name, subdomain)
    VALUES ('Default Organization', 'default');
  END IF;
END$$;

-- Helper to fetch default org id
CREATE OR REPLACE FUNCTION public.get_default_org_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  oid uuid;
BEGIN
  SELECT id INTO oid FROM public.organizations ORDER BY created_at ASC LIMIT 1;
  RETURN oid;
END;
$$;

-- 2) Add organization_id to relevant tables and backfill
-- Note: Translations and languages remain global (shared across tenants)

-- Safe helper macro-like: add col if not exists
DO $$
BEGIN
  -- employees
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='employees' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN organization_id uuid;
  END IF;

  -- user_roles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_roles' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN organization_id uuid;
  END IF;

  -- departments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='departments' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.departments ADD COLUMN organization_id uuid;
  END IF;

  -- organization_settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organization_settings' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.organization_settings ADD COLUMN organization_id uuid;
  END IF;

  -- email_templates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='email_templates' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.email_templates ADD COLUMN organization_id uuid;
  END IF;

  -- courses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='courses' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN organization_id uuid;
  END IF;

  -- plans and related
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='plans' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='plan_modules' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.plan_modules ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='plan_resources' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.plan_resources ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='plan_trainers' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.plan_trainers ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='plan_employees' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.plan_employees ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='plan_evaluations' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.plan_evaluations ADD COLUMN organization_id uuid;
  END IF;

  -- sessions and enrollments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sessions' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='session_enrollments' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.session_enrollments ADD COLUMN organization_id uuid;
  END IF;

  -- training requests and costs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='training_requests' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.training_requests ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='course_cost_actuals' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.course_cost_actuals ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cost_actuals' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.cost_actuals ADD COLUMN organization_id uuid;
  END IF;

  -- evaluations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='evaluation_responses' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.evaluation_responses ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='course_evaluation_responses' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.course_evaluation_responses ADD COLUMN organization_id uuid;
  END IF;

  -- trainers/vendors
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='external_trainers' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.external_trainers ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='training_vendors' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.training_vendors ADD COLUMN organization_id uuid;
  END IF;

  -- audit/logs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='training_audit' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.training_audit ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='security_audit_logs' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.security_audit_logs ADD COLUMN organization_id uuid;
  END IF;

  -- workflows
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='workflow_definitions' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.workflow_definitions ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='workflow_instances' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.workflow_instances ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='workflow_tasks' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.workflow_tasks ADD COLUMN organization_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='workflow_instance_events' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.workflow_instance_events ADD COLUMN organization_id uuid;
  END IF;

  -- certificates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='employee_certificates' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.employee_certificates ADD COLUMN organization_id uuid;
  END IF;
END$$;

-- Backfill all organization_id to default org
DO $$
DECLARE
  dorg uuid := public.get_default_org_id();
BEGIN
  UPDATE public.employees SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.user_roles SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.departments SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.organization_settings SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.email_templates SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.courses SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.plans SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.plan_modules SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.plan_resources SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.plan_trainers SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.plan_employees SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.plan_evaluations SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.sessions SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.session_enrollments SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.training_requests SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.course_cost_actuals SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.cost_actuals SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.evaluation_responses SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.course_evaluation_responses SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.external_trainers SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.training_vendors SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.training_audit SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.security_audit_logs SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.workflow_definitions SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.workflow_instances SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.workflow_tasks SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.workflow_instance_events SET organization_id = COALESCE(organization_id, dorg);
  UPDATE public.employee_certificates SET organization_id = COALESCE(organization_id, dorg);
END$$;

-- Constraints, FKs, and indexes
ALTER TABLE public.employees
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT employees_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.user_roles
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT user_roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key,
  ADD CONSTRAINT user_roles_unique_per_org UNIQUE (user_id, role, organization_id);

ALTER TABLE public.departments
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT departments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.organization_settings
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT organization_settings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD CONSTRAINT organization_settings_one_per_org UNIQUE (organization_id);

ALTER TABLE public.email_templates
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT email_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.courses
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT courses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.plans
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT plans_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.plan_modules
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT plan_modules_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.plan_resources
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT plan_resources_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.plan_trainers
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT plan_trainers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.plan_employees
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT plan_employees_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.plan_evaluations
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT plan_evaluations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.sessions
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT sessions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.session_enrollments
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT session_enrollments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.training_requests
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT training_requests_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.course_cost_actuals
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT course_cost_actuals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.cost_actuals
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT cost_actuals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.evaluation_responses
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT evaluation_responses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.course_evaluation_responses
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT course_evaluation_responses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.external_trainers
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT external_trainers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.training_vendors
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT training_vendors_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.training_audit
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT training_audit_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.security_audit_logs
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT security_audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.workflow_definitions
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT workflow_definitions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.workflow_instances
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT workflow_instances_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.workflow_tasks
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT workflow_tasks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.workflow_instance_events
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT workflow_instance_events_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.employee_certificates
  ALTER COLUMN organization_id SET NOT NULL,
  ADD CONSTRAINT employee_certificates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_employees_org ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON public.user_roles(organization_id);
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

-- 3) Update RLS policies to be org-scoped
-- Employees
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Managers and admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
CREATE POLICY "Admins can manage employees"
ON public.employees
FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

CREATE POLICY "Managers and admins can view all employees"
ON public.employees
FOR SELECT
USING (
  (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
);

CREATE POLICY "Users can view their own employee record"
ON public.employees
FOR SELECT
USING (
  auth.uid() = auth_user_id AND organization_id = public.get_current_user_org()
);

-- User roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot delete their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot update their own roles" ON public.user_roles;
CREATE POLICY "Admins can manage org roles"
ON public.user_roles
FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

CREATE POLICY "Users can view their own roles in org"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() AND organization_id = public.get_current_user_org());

CREATE POLICY "Admins only can delete roles in org"
ON public.user_roles
FOR DELETE
USING (public.has_org_role(auth.uid(), 'admin', organization_id) AND auth.uid() <> user_id);

CREATE POLICY "Admins only can update roles in org"
ON public.user_roles
FOR UPDATE
USING (public.has_org_role(auth.uid(), 'admin', organization_id) AND auth.uid() <> user_id)
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

-- Departments
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone authenticated can view departments" ON public.departments;
CREATE POLICY "Admins can manage departments"
ON public.departments
FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

CREATE POLICY "Org users can view departments"
ON public.departments
FOR SELECT
USING (organization_id = public.get_current_user_org());

-- Organization settings
DROP POLICY IF EXISTS "Admins can manage org settings" ON public.organization_settings;
CREATE POLICY "Admins can manage org settings"
ON public.organization_settings
FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

-- Email templates
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

-- Courses
DROP POLICY IF EXISTS "Admins and managers can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated can view active courses" ON public.courses;
CREATE POLICY "Admins and managers can manage courses"
ON public.courses
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'admin', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'admin', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id)
);

CREATE POLICY "Authenticated can view active courses in org"
ON public.courses
FOR SELECT
USING (
  is_active = true AND organization_id = public.get_current_user_org() AND auth.uid() IS NOT NULL
);

-- Plans and related
DROP POLICY IF EXISTS "Managers and admins can manage plans" ON public.plans;
DROP POLICY IF EXISTS "Managers and admins can view plans" ON public.plans;
CREATE POLICY "Managers and admins can manage plans"
ON public.plans
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Managers and admins can view plans"
ON public.plans
FOR SELECT
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

-- Children tables inherit org scoping via their own org_id
DROP POLICY IF EXISTS "Managers and admins can manage plan modules" ON public.plan_modules;
CREATE POLICY "Managers and admins can manage plan modules"
ON public.plan_modules
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

DROP POLICY IF EXISTS "Managers and admins can manage plan resources" ON public.plan_resources;
CREATE POLICY "Managers and admins can manage plan resources"
ON public.plan_resources
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

DROP POLICY IF EXISTS "Managers and admins can manage plan trainers" ON public.plan_trainers;
CREATE POLICY "Managers and admins can manage plan trainers"
ON public.plan_trainers
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

DROP POLICY IF EXISTS "Managers and admins can manage plan employees" ON public.plan_employees;
DROP POLICY IF EXISTS "Users can view their own plan assignments" ON public.plan_employees;
CREATE POLICY "Managers and admins can manage plan employees"
ON public.plan_employees
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Users can view their own plan assignments"
ON public.plan_employees
FOR SELECT
USING (
  employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org()
);

DROP POLICY IF EXISTS "Managers and admins can manage plan evaluations" ON public.plan_evaluations;
CREATE POLICY "Managers and admins can manage plan evaluations"
ON public.plan_evaluations
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

-- Sessions
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Managers, instructors and admins can manage sessions" ON public.sessions;
CREATE POLICY "Authenticated users can view sessions in org"
ON public.sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND organization_id = public.get_current_user_org()
);

CREATE POLICY "Managers, instructors and admins can manage sessions"
ON public.sessions
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'admin', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'admin', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id)
);

-- Session enrollments
DROP POLICY IF EXISTS "Managers and instructors can manage enrollments" ON public.session_enrollments;
DROP POLICY IF EXISTS "Managers and instructors can view enrollments" ON public.session_enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.session_enrollments;
CREATE POLICY "Managers and instructors can manage enrollments"
ON public.session_enrollments
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Managers and instructors can view enrollments"
ON public.session_enrollments
FOR SELECT
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Users can view their own enrollments"
ON public.session_enrollments
FOR SELECT
USING (
  employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org()
);

-- Training requests
DROP POLICY IF EXISTS "Employees can create training requests" ON public.training_requests;
DROP POLICY IF EXISTS "Employees can view their own training requests" ON public.training_requests;
DROP POLICY IF EXISTS "Managers and admins can update training requests" ON public.training_requests;
CREATE POLICY "Employees can create training requests"
ON public.training_requests
FOR INSERT
WITH CHECK (
  (requested_by = public.get_employee_id(auth.uid()) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
  AND organization_id = public.get_current_user_org()
);

CREATE POLICY "Employees can view their own training requests"
ON public.training_requests
FOR SELECT
USING (
  organization_id = public.get_current_user_org() AND (
    employee_id = public.get_employee_id(auth.uid()) OR requested_by = public.get_employee_id(auth.uid()) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
  )
);

CREATE POLICY "Managers and admins can update training requests"
ON public.training_requests
FOR UPDATE
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id) OR ((requested_by = public.get_employee_id(auth.uid())) AND (status IN ('draft','rejected')))
);

-- Course cost actuals
DROP POLICY IF EXISTS "Employees can submit their own course expenses" ON public.course_cost_actuals;
DROP POLICY IF EXISTS "Employees can update their pending expenses" ON public.course_cost_actuals;
DROP POLICY IF EXISTS "Employees can view their own course expenses" ON public.course_cost_actuals;
DROP POLICY IF EXISTS "Finance and managers can manage course expenses" ON public.course_cost_actuals;
DROP POLICY IF EXISTS "Finance and managers can view all course expenses" ON public.course_cost_actuals;
CREATE POLICY "Employees can submit their own course expenses"
ON public.course_cost_actuals
FOR INSERT
WITH CHECK (
  employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org()
);

CREATE POLICY "Employees can update their pending expenses"
ON public.course_cost_actuals
FOR UPDATE
USING (
  employee_id = public.get_employee_id(auth.uid()) AND status = 'pending' AND organization_id = public.get_current_user_org()
);

CREATE POLICY "Employees can view their own course expenses"
ON public.course_cost_actuals
FOR SELECT
USING (
  employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org()
);

CREATE POLICY "Finance and managers can manage course expenses"
ON public.course_cost_actuals
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'finance', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'finance', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Finance and managers can view all course expenses"
ON public.course_cost_actuals
FOR SELECT
USING (
  public.has_org_role(auth.uid(), 'finance', organization_id) OR public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

-- Cost actuals
DROP POLICY IF EXISTS "Finance and admin can manage costs" ON public.cost_actuals;
CREATE POLICY "Finance and admin can manage org costs"
ON public.cost_actuals
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'finance', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'finance', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

-- Evaluation responses
DROP POLICY IF EXISTS "Managers can view all evaluation responses" ON public.evaluation_responses;
DROP POLICY IF EXISTS "Users can submit their own evaluations" ON public.evaluation_responses;
DROP POLICY IF EXISTS "Users can view their own evaluation responses" ON public.evaluation_responses;
CREATE POLICY "Managers can view all evaluation responses"
ON public.evaluation_responses
FOR SELECT
USING (
  (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
);

CREATE POLICY "Users can submit their own evaluations"
ON public.evaluation_responses
FOR INSERT
WITH CHECK (
  employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org()
);

CREATE POLICY "Users can view their own evaluation responses"
ON public.evaluation_responses
FOR SELECT
USING (
  employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org()
);

-- Course evaluation responses
DROP POLICY IF EXISTS "Managers can view all course evaluation responses" ON public.course_evaluation_responses;
DROP POLICY IF EXISTS "Users can submit their own course evaluations" ON public.course_evaluation_responses;
DROP POLICY IF EXISTS "Users can view their own course evaluation responses" ON public.course_evaluation_responses;
CREATE POLICY "Managers can view all course evaluation responses"
ON public.course_evaluation_responses
FOR SELECT
USING (
  (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id))
);

CREATE POLICY "Users can submit their own course evaluations"
ON public.course_evaluation_responses
FOR INSERT
WITH CHECK (
  employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org()
);

CREATE POLICY "Users can view their own course evaluation responses"
ON public.course_evaluation_responses
FOR SELECT
USING (
  employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org()
);

-- External trainers
DROP POLICY IF EXISTS "Managers and admins can manage external trainers" ON public.external_trainers;
DROP POLICY IF EXISTS "Privileged roles can view external trainers" ON public.external_trainers;
CREATE POLICY "Managers and admins can manage external trainers"
ON public.external_trainers
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Privileged roles can view external trainers"
ON public.external_trainers
FOR SELECT
USING (
  (public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id))
  AND is_active = true
);

-- Training vendors
DROP POLICY IF EXISTS "Anyone can view active approved vendors" ON public.training_vendors;
DROP POLICY IF EXISTS "Managers and admins can manage vendors" ON public.training_vendors;
CREATE POLICY "Anyone can view active approved vendors in org"
ON public.training_vendors
FOR SELECT
USING (
  is_active = true AND is_approved = true AND organization_id = public.get_current_user_org()
);

CREATE POLICY "Managers and admins can manage vendors"
ON public.training_vendors
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

-- Security audit logs
DROP POLICY IF EXISTS "Admins can create security audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Admins can view security audit logs" ON public.security_audit_logs;
CREATE POLICY "Admins can create security audit logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

CREATE POLICY "Admins can view security audit logs"
ON public.security_audit_logs
FOR SELECT
USING (public.has_org_role(auth.uid(), 'admin', organization_id));

-- Training audit
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.training_audit;
CREATE POLICY "Admins can view audit logs"
ON public.training_audit
FOR SELECT
USING (public.has_org_role(auth.uid(), 'admin', organization_id));

-- Workflow tables
DROP POLICY IF EXISTS "Managers and admins can manage workflow definitions" ON public.workflow_definitions;
DROP POLICY IF EXISTS "Managers and admins can view workflow definitions" ON public.workflow_definitions;
CREATE POLICY "Managers and admins can manage workflow definitions"
ON public.workflow_definitions
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Managers and admins can view workflow definitions"
ON public.workflow_definitions
FOR SELECT
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

DROP POLICY IF EXISTS "Managers and admins can manage workflow instances" ON public.workflow_instances;
DROP POLICY IF EXISTS "Managers and admins can view workflow instances" ON public.workflow_instances;
CREATE POLICY "Managers and admins can manage workflow instances"
ON public.workflow_instances
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Managers and admins can view workflow instances"
ON public.workflow_instances
FOR SELECT
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

DROP POLICY IF EXISTS "Managers and admins can insert workflow events" ON public.workflow_instance_events;
DROP POLICY IF EXISTS "Managers and admins can view workflow events" ON public.workflow_instance_events;
CREATE POLICY "Managers and admins can insert workflow events"
ON public.workflow_instance_events
FOR INSERT
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Managers and admins can view workflow events"
ON public.workflow_instance_events
FOR SELECT
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

DROP POLICY IF EXISTS "Managers and admins can manage workflow tasks" ON public.workflow_tasks;
DROP POLICY IF EXISTS "Users can update their assigned tasks" ON public.workflow_tasks;
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON public.workflow_tasks;
CREATE POLICY "Managers and admins can manage workflow tasks"
ON public.workflow_tasks
FOR ALL
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
)
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Users can update their assigned tasks"
ON public.workflow_tasks
FOR UPDATE
USING (
  assigned_to_user = auth.uid() AND organization_id = public.get_current_user_org()
)
WITH CHECK (
  assigned_to_user = auth.uid() AND organization_id = public.get_current_user_org()
);

CREATE POLICY "Users can view their assigned tasks"
ON public.workflow_tasks
FOR SELECT
USING (
  assigned_to_user = auth.uid() AND organization_id = public.get_current_user_org()
);

-- Certificates
DROP POLICY IF EXISTS "Managers and compliance can view certificates" ON public.employee_certificates;
DROP POLICY IF EXISTS "System can create certificates" ON public.employee_certificates;
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.employee_certificates;
CREATE POLICY "Managers and compliance can view certificates"
ON public.employee_certificates
FOR SELECT
USING (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'compliance', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "System can create certificates"
ON public.employee_certificates
FOR INSERT
WITH CHECK (
  public.has_org_role(auth.uid(), 'manager', organization_id) OR public.has_org_role(auth.uid(), 'instructor', organization_id) OR public.has_org_role(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Users can view their own certificates"
ON public.employee_certificates
FOR SELECT
USING (
  employee_id = public.get_employee_id(auth.uid()) AND organization_id = public.get_current_user_org()
);

-- 4) Update signup trigger to auto-create/assign organizations
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
  -- Try to find or create organization based on metadata
  IF meta_subdomain IS NOT NULL AND meta_subdomain <> '' THEN
    SELECT id INTO org_id FROM public.organizations WHERE subdomain = meta_subdomain;
    IF org_id IS NULL THEN
      IF meta_org_name = '' THEN
        meta_org_name := split_part(NEW.email, '@', 2);
      END IF;
      INSERT INTO public.organizations (name, subdomain)
      VALUES (meta_org_name, meta_subdomain)
      RETURNING id INTO org_id;
      created_new_org := true;
    END IF;
  END IF;

  -- Fallback: use existing default org or create one
  IF org_id IS NULL THEN
    SELECT id INTO org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
    IF org_id IS NULL THEN
      INSERT INTO public.organizations (name, subdomain)
      VALUES ('Default Organization', 'default')
      RETURNING id INTO org_id;
      created_new_org := true;
    END IF;
  END IF;

  -- Insert employee record
  INSERT INTO public.employees (auth_user_id, name, email, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    org_id
  );

  -- Assign default employee role in this org
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, 'employee', org_id)
  ON CONFLICT DO NOTHING;

  -- Make first user of a newly created org an admin
  IF created_new_org THEN
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (NEW.id, 'admin', org_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure a trigger exists on auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END$$;
