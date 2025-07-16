import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type CourseEvaluationResponse = Tables<'course_evaluation_responses'> & {
  employee?: Tables<'employees'>;
  template?: Tables<'evaluation_templates'>;
  course?: Tables<'courses'>;
  training_request?: Tables<'training_requests'>;
};

export function useCourseEvaluations() {
  const [responses, setResponses] = useState<CourseEvaluationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('course_evaluation_responses')
        .select(`
          *,
          employee:employees(*),
          template:evaluation_templates(*),
          course:courses(*),
          training_request:training_requests(*)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error fetching course evaluation responses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch course evaluation responses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvaluation = async (
    courseId: string, 
    templateId: string, 
    responses: any, 
    overallRating: number,
    trainingRequestId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!employee) throw new Error('Employee record not found');

      const { data, error } = await supabase
        .from('course_evaluation_responses')
        .insert({
          course_id: courseId,
          template_id: templateId,
          employee_id: employee.id,
          responses,
          overall_rating: overallRating,
          training_request_id: trainingRequestId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course evaluation submitted successfully",
      });

      await fetchResponses();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating course evaluation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit course evaluation",
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

    // Top courses by response count and rating
    const courseCounts: { [key: string]: { name: string; count: number; avgRating: number; ratings: number[] } } = {};
    responses.forEach(response => {
      if (response.course) {
        const courseName = response.course.title;
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
    fetchResponses();
  }, []);

  return {
    responses,
    loading,
    createEvaluation,
    getAnalytics,
    refetch: fetchResponses,
  };
}