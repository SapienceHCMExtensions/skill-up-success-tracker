import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;
type CourseInsert = TablesInsert<'courses'>;
type CourseUpdate = TablesUpdate<'courses'>;

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (courseData: CourseInsert) => {
    try {
      // Debug: Check current authentication state
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      // Debug: Check user role
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        console.log('User role:', roleData?.role);
      }

      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) throw error;

      setCourses(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create course. You need admin or manager role to create courses.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateCourse = async (id: string, courseData: CourseUpdate) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCourses(prev => prev.map(course => 
        course.id === id ? data : course
      ));
      
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update course",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setCourses(prev => prev.filter(course => course.id !== id));
      toast({
        title: "Success",
        description: "Course deactivated successfully",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Error deactivating course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate course",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return {
    courses,
    loading,
    createCourse,
    updateCourse,
    deleteCourse,
    refetch: fetchCourses,
  };
}