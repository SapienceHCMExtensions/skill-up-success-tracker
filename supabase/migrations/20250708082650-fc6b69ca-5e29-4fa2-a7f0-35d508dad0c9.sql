-- Add new columns to plans table
ALTER TABLE public.plans ADD COLUMN description TEXT;
ALTER TABLE public.plans ADD COLUMN objectives JSONB;
ALTER TABLE public.plans ADD COLUMN target_audience TEXT;
ALTER TABLE public.plans ADD COLUMN skill_gap_tags TEXT[];
ALTER TABLE public.plans ADD COLUMN delivery_mode TEXT CHECK (delivery_mode IN ('online', 'offline', 'blended'));
ALTER TABLE public.plans ADD COLUMN tools_required TEXT[];
ALTER TABLE public.plans ADD COLUMN success_metrics JSONB;
ALTER TABLE public.plans ADD COLUMN location_platform_info TEXT;
ALTER TABLE public.plans ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- Create plan_modules table
CREATE TABLE public.plan_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content_type TEXT,
    duration_hours INTEGER DEFAULT 0,
    learning_outcomes TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create plan_resources table
CREATE TABLE public.plan_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    resource_type TEXT,
    url_or_path TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create plan_trainers table
CREATE TABLE public.plan_trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.employees(id),
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (plan_id, trainer_id)
);

-- Create plan_evaluations table
CREATE TABLE public.plan_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
    evaluation_type TEXT CHECK (evaluation_type IN ('pre_test', 'post_test', 'assessment', 'survey')),
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create plan_cost_breakdown table
CREATE TABLE public.plan_cost_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    cost NUMERIC(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.plan_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_cost_breakdown ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Managers and admins can manage plan modules" ON public.plan_modules FOR ALL 
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers and admins can manage plan resources" ON public.plan_resources FOR ALL 
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers and admins can manage plan trainers" ON public.plan_trainers FOR ALL 
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers and admins can manage plan evaluations" ON public.plan_evaluations FOR ALL 
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers and admins can manage plan cost breakdown" ON public.plan_cost_breakdown FOR ALL 
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));