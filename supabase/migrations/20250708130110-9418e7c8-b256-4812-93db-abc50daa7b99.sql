-- Create languages table
CREATE TABLE public.languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_rtl BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create translations table
CREATE TABLE public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  translation_key TEXT NOT NULL,
  translation_value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(language_id, translation_key)
);

-- Enable RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Create policies for languages
CREATE POLICY "Anyone can view active languages" 
ON public.languages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage languages" 
ON public.languages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for translations
CREATE POLICY "Anyone can view translations" 
ON public.translations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage translations" 
ON public.translations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create update timestamp triggers
CREATE TRIGGER update_languages_updated_at
BEFORE UPDATE ON public.languages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_translations_updated_at
BEFORE UPDATE ON public.translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default languages
INSERT INTO public.languages (code, name, native_name, is_rtl, is_active) VALUES
('en', 'English', 'English', false, true),
('ar', 'Arabic', 'العربية', true, true);

-- Insert default English translations
INSERT INTO public.translations (language_id, translation_key, translation_value, category) 
SELECT l.id, t.key, t.value, t.category
FROM public.languages l,
(VALUES
  ('app.title', 'Training Management System', 'general'),
  ('nav.dashboard', 'Dashboard', 'navigation'),
  ('nav.courses', 'Course Catalog', 'navigation'),
  ('nav.plans', 'Training Plans', 'navigation'),
  ('nav.sessions', 'Training Sessions', 'navigation'),
  ('nav.scorecards', 'Employee Scorecards', 'navigation'),
  ('nav.evaluations', 'Evaluations', 'navigation'),
  ('nav.costs', 'Cost Management', 'navigation'),
  ('nav.alerts', 'Certificate Alerts', 'navigation'),
  ('nav.users', 'User Management', 'navigation'),
  ('common.add', 'Add', 'common'),
  ('common.edit', 'Edit', 'common'),
  ('common.delete', 'Delete', 'common'),
  ('common.save', 'Save', 'common'),
  ('common.cancel', 'Cancel', 'common'),
  ('common.close', 'Close', 'common'),
  ('common.loading', 'Loading...', 'common'),
  ('common.search', 'Search', 'common'),
  ('common.filter', 'Filter', 'common'),
  ('common.welcome', 'Welcome', 'common'),
  ('session.schedule', 'Schedule Training', 'sessions'),
  ('session.title', 'Session Title', 'sessions'),
  ('session.location', 'Location', 'sessions'),
  ('session.instructor', 'Instructor', 'sessions'),
  ('session.startDate', 'Start Date & Time', 'sessions'),
  ('session.endDate', 'End Date & Time', 'sessions'),
  ('session.maxSeats', 'Maximum Seats', 'sessions')
) AS t(key, value, category)
WHERE l.code = 'en';

-- Insert default Arabic translations
INSERT INTO public.translations (language_id, translation_key, translation_value, category)
SELECT l.id, t.key, t.value, t.category
FROM public.languages l,
(VALUES
  ('app.title', 'نظام إدارة التدريب', 'general'),
  ('nav.dashboard', 'لوحة التحكم', 'navigation'),
  ('nav.courses', 'كتالوج الدورات', 'navigation'),
  ('nav.plans', 'خطط التدريب', 'navigation'),
  ('nav.sessions', 'جلسات التدريب', 'navigation'),
  ('nav.scorecards', 'بطاقات الموظفين', 'navigation'),
  ('nav.evaluations', 'التقييمات', 'navigation'),
  ('nav.costs', 'إدارة التكاليف', 'navigation'),
  ('nav.alerts', 'تنبيهات الشهادات', 'navigation'),
  ('nav.users', 'إدارة المستخدمين', 'navigation'),
  ('common.add', 'إضافة', 'common'),
  ('common.edit', 'تحرير', 'common'),
  ('common.delete', 'حذف', 'common'),
  ('common.save', 'حفظ', 'common'),
  ('common.cancel', 'إلغاء', 'common'),
  ('common.close', 'إغلاق', 'common'),
  ('common.loading', 'جاري التحميل...', 'common'),
  ('common.search', 'البحث', 'common'),
  ('common.filter', 'فلترة', 'common'),
  ('common.welcome', 'مرحباً', 'common'),
  ('session.schedule', 'جدولة التدريب', 'sessions'),
  ('session.title', 'عنوان الجلسة', 'sessions'),
  ('session.location', 'الموقع', 'sessions'),
  ('session.instructor', 'المدرب', 'sessions'),
  ('session.startDate', 'تاريخ ووقت البداية', 'sessions'),
  ('session.endDate', 'تاريخ ووقت النهاية', 'sessions'),
  ('session.maxSeats', 'العدد الأقصى للمقاعد', 'sessions')
) AS t(key, value, category)
WHERE l.code = 'ar';