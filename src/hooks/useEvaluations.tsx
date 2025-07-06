import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type EvaluationTemplate = Tables<'evaluation_templates'>;
type EvaluationResponse = Tables<'evaluation_responses'> & {
  employee?: Tables<'employees'>;
  template?: Tables<'evaluation_templates'>;
  session?: Tables<'sessions'> & {
    course?: Tables<'courses'>;
  };
};

export function useEvaluations() {
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [responses, setResponses] = useState<EvaluationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_templates')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch evaluation templates",
        variant: "destructive",
      });
    }
  };

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_responses')
        .select(`
          *,
          employee:employees(*),
          template:evaluation_templates(*),
          session:sessions(
            *,
            course:courses(*)
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch evaluation responses",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTemplates(), fetchResponses()]);
    setLoading(false);
  };

  const createEvaluation = async (sessionId: string, templateId: string, responses: any, overallRating: number) => {
    try {
      const { data, error } = await supabase
        .from('evaluation_responses')
        .insert({
          session_id: sessionId,
          template_id: templateId,
          responses,
          overall_rating: overallRating,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Evaluation submitted successfully",
      });

      await fetchResponses();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating evaluation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit evaluation",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const getAnalytics = () => {
    const analytics = {
      totalResponses: responses.length,
      averageRating: responses.length > 0 
        ? responses.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / responses.length
        : 0,
      responsesByMonth: [] as any[],
      ratingDistribution: [] as any[],
      topCourses: [] as any[],
      responseRate: 0,
    };

    // Group responses by month
    const monthlyData: { [key: string]: number } = {};
    responses.forEach(response => {
      if (response.submitted_at) {
        const month = new Date(response.submitted_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      }
    });

    analytics.responsesByMonth = Object.entries(monthlyData).map(([month, count]) => ({
      month,
      responses: count,
    }));

    // Rating distribution
    const ratingCounts: { [key: number]: number } = {};
    responses.forEach(response => {
      if (response.overall_rating) {
        const rating = Math.floor(response.overall_rating);
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      }
    });

    analytics.ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
      rating: `${rating} Star${parseInt(rating) !== 1 ? 's' : ''}`,
      count,
    }));

    // Top courses by response count
    const courseCounts: { [key: string]: { name: string; count: number; avgRating: number; ratings: number[] } } = {};
    responses.forEach(response => {
      if (response.session?.course) {
        const courseName = response.session.course.title;
        if (!courseCounts[courseName]) {
          courseCounts[courseName] = { name: courseName, count: 0, avgRating: 0, ratings: [] };
        }
        courseCounts[courseName].count += 1;
        if (response.overall_rating) {
          courseCounts[courseName].ratings.push(response.overall_rating);
        }
      }
    });

    // Calculate average ratings
    Object.values(courseCounts).forEach(course => {
      if (course.ratings.length > 0) {
        course.avgRating = course.ratings.reduce((sum, rating) => sum + rating, 0) / course.ratings.length;
      }
    });

    analytics.topCourses = Object.values(courseCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return analytics;
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    templates,
    responses,
    loading,
    createEvaluation,
    getAnalytics,
    refetch: fetchData,
  };
}