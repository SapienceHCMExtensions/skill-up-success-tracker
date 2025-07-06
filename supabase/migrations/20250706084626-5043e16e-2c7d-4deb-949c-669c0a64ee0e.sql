-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE public.provider_type AS ENUM ('internal', 'external');
CREATE TYPE public.session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.enrollment_status AS ENUM ('scheduled', 'in_progress', 'completed', 'not_completed', 'absent');
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'instructor', 'employee', 'finance', 'compliance');

-- Create employees table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create departments table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    manager_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key for department_id in employees
ALTER TABLE public.employees ADD CONSTRAINT fk_employee_department 
FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    provider_type provider_type NOT NULL DEFAULT 'internal',
    competencies TEXT[],
    duration_hours INTEGER NOT NULL DEFAULT 0,
    default_cost NUMERIC(12,2) DEFAULT 0,
    certificate_validity_months INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create plans table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    department_id UUID REFERENCES public.departments(id),
    estimated_cost NUMERIC(12,2) DEFAULT 0,
    actual_cost NUMERIC(12,2) DEFAULT 0,
    created_by UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) NOT NULL,
    plan_id UUID REFERENCES public.plans(id),
    instructor_id UUID REFERENCES public.employees(id),
    title TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    max_seats INTEGER DEFAULT 20,
    status session_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create plan_employees table (assignment of employees to plans)
CREATE TABLE public.plan_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    required BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (plan_id, employee_id)
);

-- Create session_enrollments table
CREATE TABLE public.session_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'scheduled',
    score NUMERIC(5,2),
    completion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (session_id, employee_id)
);

-- Create evaluation_templates table
CREATE TABLE public.evaluation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id),
    title TEXT NOT NULL,
    questions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create evaluation_responses table
CREATE TABLE public.evaluation_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.evaluation_templates(id),
    session_id UUID REFERENCES public.sessions(id),
    employee_id UUID REFERENCES public.employees(id),
    responses JSONB NOT NULL,
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (template_id, session_id, employee_id)
);

-- Create employee_certificates table
CREATE TABLE public.employee_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id),
    session_id UUID REFERENCES public.sessions(id),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    certificate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cost_actuals table
CREATE TABLE public.cost_actuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id),
    amount NUMERIC(12,2) NOT NULL,
    invoice_no TEXT,
    description TEXT,
    recorded_by UUID REFERENCES public.employees(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create training_audit table
CREATE TABLE public.training_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    row_pk UUID NOT NULL,
    action TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    old_data JSONB,
    new_data JSONB,
    diff JSONB
);

-- Create indexes for performance
CREATE INDEX idx_sessions_start_date_dept ON public.sessions(start_date, instructor_id);
CREATE INDEX idx_employee_certificates_expiry ON public.employee_certificates(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_session_enrollments_employee ON public.session_enrollments(employee_id);
CREATE INDEX idx_session_enrollments_session ON public.session_enrollments(session_id);
CREATE INDEX idx_employees_auth_user ON public.employees(auth_user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_audit ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user employee record
CREATE OR REPLACE FUNCTION public.get_employee_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id
  FROM public.employees
  WHERE auth_user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies

-- Courses policies (public read, admin/manager write)
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage courses" ON public.courses FOR ALL 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Employees policies
CREATE POLICY "Users can view their own employee record" ON public.employees FOR SELECT 
USING (auth_user_id = auth.uid());
CREATE POLICY "Managers and admins can view all employees" ON public.employees FOR SELECT 
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage employees" ON public.employees FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Departments policies
CREATE POLICY "Anyone authenticated can view departments" ON public.departments FOR SELECT 
TO authenticated USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT 
USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Plans policies
CREATE POLICY "Managers and admins can view plans" ON public.plans FOR SELECT 
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers and admins can manage plans" ON public.plans FOR ALL 
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

-- Sessions policies
CREATE POLICY "Authenticated users can view sessions" ON public.sessions FOR SELECT 
TO authenticated USING (true);
CREATE POLICY "Managers, instructors and admins can manage sessions" ON public.sessions FOR ALL 
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'instructor')
);

-- Session enrollments policies
CREATE POLICY "Users can view their own enrollments" ON public.session_enrollments FOR SELECT 
USING (employee_id = public.get_employee_id(auth.uid()));
CREATE POLICY "Managers and instructors can view enrollments" ON public.session_enrollments FOR SELECT 
USING (
  public.has_role(auth.uid(), 'manager') 
  OR public.has_role(auth.uid(), 'instructor')
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Managers and instructors can manage enrollments" ON public.session_enrollments FOR ALL 
USING (
  public.has_role(auth.uid(), 'manager') 
  OR public.has_role(auth.uid(), 'instructor')
  OR public.has_role(auth.uid(), 'admin')
);

-- Employee certificates policies
CREATE POLICY "Users can view their own certificates" ON public.employee_certificates FOR SELECT 
USING (employee_id = public.get_employee_id(auth.uid()));
CREATE POLICY "Managers and compliance can view certificates" ON public.employee_certificates FOR SELECT 
USING (
  public.has_role(auth.uid(), 'manager') 
  OR public.has_role(auth.uid(), 'compliance')
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "System can create certificates" ON public.employee_certificates FOR INSERT 
USING (
  public.has_role(auth.uid(), 'manager') 
  OR public.has_role(auth.uid(), 'instructor')
  OR public.has_role(auth.uid(), 'admin')
);

-- Evaluation policies
CREATE POLICY "Anyone can view evaluation templates" ON public.evaluation_templates FOR SELECT 
TO authenticated USING (true);
CREATE POLICY "Users can submit their own evaluations" ON public.evaluation_responses FOR INSERT 
WITH CHECK (employee_id = public.get_employee_id(auth.uid()));
CREATE POLICY "Users can view their own evaluation responses" ON public.evaluation_responses FOR SELECT 
USING (employee_id = public.get_employee_id(auth.uid()));
CREATE POLICY "Managers can view all evaluation responses" ON public.evaluation_responses FOR SELECT 
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

-- Cost actuals policies (finance and admin only)
CREATE POLICY "Finance and admin can manage costs" ON public.cost_actuals FOR ALL 
USING (public.has_role(auth.uid(), 'finance') OR public.has_role(auth.uid(), 'admin'));

-- Audit policies (admin only)
CREATE POLICY "Admins can view audit logs" ON public.training_audit FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for automatic certificate generation
CREATE OR REPLACE FUNCTION public.generate_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    course_cert_months INTEGER;
    expiry_date DATE;
BEGIN
    -- Only generate certificate when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Get certificate validity from course
        SELECT certificate_validity_months INTO course_cert_months
        FROM public.courses c
        JOIN public.sessions s ON s.course_id = c.id
        WHERE s.id = NEW.session_id;
        
        -- Calculate expiry date if certificate is valid
        IF course_cert_months > 0 THEN
            expiry_date := CURRENT_DATE + (course_cert_months || ' months')::INTERVAL;
        END IF;
        
        -- Insert certificate record
        INSERT INTO public.employee_certificates (
            employee_id,
            course_id,
            session_id,
            issue_date,
            expiry_date
        )
        SELECT 
            NEW.employee_id,
            s.course_id,
            NEW.session_id,
            CURRENT_DATE,
            expiry_date
        FROM public.sessions s
        WHERE s.id = NEW.session_id
        ON CONFLICT (employee_id, course_id, session_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for automatic certificate generation
CREATE TRIGGER trigger_generate_certificate
    AFTER UPDATE ON public.session_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_certificate();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into employees table
    INSERT INTO public.employees (auth_user_id, name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email
    );
    
    -- Assign default employee role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee');
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create updated_at triggers
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_session_enrollments_updated_at BEFORE UPDATE ON public.session_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();