-- 1) Create workflow tables with RLS and triggers

-- Create table: workflow_definitions
CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | active | inactive | archived
  version INTEGER NOT NULL DEFAULT 1,
  definition JSONB NOT NULL DEFAULT '{}'::jsonb, -- stores nodes, edges, and metadata
  trigger_entity TEXT,            -- e.g., 'training_requests'
  trigger_event TEXT,             -- e.g., 'on_create', 'on_update'
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workflow_definitions_name_version_unique UNIQUE (name, version)
);

-- Ensure updated_at is maintained
DROP TRIGGER IF EXISTS trg_update_workflow_definitions_updated_at ON public.workflow_definitions;
CREATE TRIGGER trg_update_workflow_definitions_updated_at
BEFORE UPDATE ON public.workflow_definitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_status ON public.workflow_definitions (status);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_category ON public.workflow_definitions (category);

-- Enable RLS and policies
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers and admins can manage workflow definitions" ON public.workflow_definitions;
CREATE POLICY "Managers and admins can manage workflow definitions"
ON public.workflow_definitions
FOR ALL
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view active workflow definitions" ON public.workflow_definitions;
CREATE POLICY "Anyone can view active workflow definitions"
ON public.workflow_definitions
FOR SELECT
USING ((status = 'active') OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));


-- Create table: workflow_instances
CREATE TABLE IF NOT EXISTS public.workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  definition_version INTEGER NOT NULL,
  entity_type TEXT NOT NULL,      -- e.g., 'training_requests'
  entity_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'running', -- running | completed | failed | cancelled | paused
  current_node_id TEXT,
  started_by UUID,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintain updated_at
DROP TRIGGER IF EXISTS trg_update_workflow_instances_updated_at ON public.workflow_instances;
CREATE TRIGGER trg_update_workflow_instances_updated_at
BEFORE UPDATE ON public.workflow_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_instances_workflow ON public.workflow_instances (workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity ON public.workflow_instances (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON public.workflow_instances (status);

-- Enable RLS and policies
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers and admins can manage workflow instances" ON public.workflow_instances;
CREATE POLICY "Managers and admins can manage workflow instances"
ON public.workflow_instances
FOR ALL
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Managers and admins can view workflow instances" ON public.workflow_instances;
CREATE POLICY "Managers and admins can view workflow instances"
ON public.workflow_instances
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));


-- Create table: workflow_tasks
CREATE TABLE IF NOT EXISTS public.workflow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL, -- approval | condition | action | notification
  status TEXT NOT NULL DEFAULT 'pending', -- pending | in_progress | completed | rejected | failed | skipped
  assigned_to_user UUID,
  assigned_to_role app_role, -- optional role for assignment
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintain updated_at
DROP TRIGGER IF EXISTS trg_update_workflow_tasks_updated_at ON public.workflow_tasks;
CREATE TRIGGER trg_update_workflow_tasks_updated_at
BEFORE UPDATE ON public.workflow_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_instance ON public.workflow_tasks (instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_user ON public.workflow_tasks (assigned_to_user);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON public.workflow_tasks (status);

-- Enable RLS and policies
ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers and admins can manage workflow tasks" ON public.workflow_tasks;
CREATE POLICY "Managers and admins can manage workflow tasks"
ON public.workflow_tasks
FOR ALL
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their assigned tasks" ON public.workflow_tasks;
CREATE POLICY "Users can view their assigned tasks"
ON public.workflow_tasks
FOR SELECT
USING (assigned_to_user = auth.uid());

DROP POLICY IF EXISTS "Users can update their assigned tasks" ON public.workflow_tasks;
CREATE POLICY "Users can update their assigned tasks"
ON public.workflow_tasks
FOR UPDATE
USING (assigned_to_user = auth.uid())
WITH CHECK (assigned_to_user = auth.uid());