import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Employee = Tables<'employees'> & {
  department?: Tables<'departments'>;
  certificates?: Tables<'employee_certificates'>[];
  enrollments?: Tables<'session_enrollments'>[];
};

type ScoreCardData = {
  employee: Employee;
  totalTrainings: number;
  completedTrainings: number;
  inProgressTrainings: number;
  certificatesEarned: number;
  certificatesExpiring: number;
  averageScore: number;
  lastTrainingDate: string | null;
  complianceStatus: 'compliant' | 'non-compliant' | 'warning';
  overallScore: number;
};

export function useScorecards() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [scorecards, setScorecards] = useState<ScoreCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments!fk_employee_department(*),
          certificates:employee_certificates(*),
          enrollments:session_enrollments(*)
        `)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employee data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateScorecards = async (selectedEmployeeIds?: string[]) => {
    try {
      setGenerating(true);
      
      // Filter employees if specific ones are selected
      const targetEmployees = selectedEmployeeIds 
        ? employees.filter(emp => selectedEmployeeIds.includes(emp.id))
        : employees;

      const scorecardData: ScoreCardData[] = [];

      for (const employee of targetEmployees) {
        // Calculate training metrics
        const enrollments = employee.enrollments || [];
        const certificates = employee.certificates || [];
        
        const totalTrainings = enrollments.length;
        const completedTrainings = enrollments.filter(e => e.status === 'completed').length;
        const inProgressTrainings = enrollments.filter(e => e.status === 'in_progress').length;
        
        const certificatesEarned = certificates.length;
        const currentDate = new Date();
        const certificatesExpiring = certificates.filter(cert => {
          if (!cert.expiry_date) return false;
          const expiryDate = new Date(cert.expiry_date);
          const threeMonthsFromNow = new Date();
          threeMonthsFromNow.setMonth(currentDate.getMonth() + 3);
          return expiryDate <= threeMonthsFromNow && expiryDate > currentDate;
        }).length;

        // Calculate average score
        const scoredEnrollments = enrollments.filter(e => e.score !== null);
        const averageScore = scoredEnrollments.length > 0 
          ? scoredEnrollments.reduce((sum, e) => sum + (e.score || 0), 0) / scoredEnrollments.length
          : 0;

        // Get last training date
        const completedEnrollments = enrollments
          .filter(e => e.completion_date)
          .sort((a, b) => new Date(b.completion_date!).getTime() - new Date(a.completion_date!).getTime());
        const lastTrainingDate = completedEnrollments.length > 0 
          ? completedEnrollments[0].completion_date 
          : null;

        // Determine compliance status
        let complianceStatus: 'compliant' | 'non-compliant' | 'warning' = 'compliant';
        if (certificatesExpiring > 0) {
          complianceStatus = 'warning';
        }
        if (totalTrainings === 0 || (totalTrainings > 0 && completedTrainings / totalTrainings < 0.5)) {
          complianceStatus = 'non-compliant';
        }

        // Calculate overall score (0-100)
        const completionRate = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0;
        const certificationBonus = certificatesEarned * 5;
        const compliancePenalty = complianceStatus === 'non-compliant' ? -20 : 
                                complianceStatus === 'warning' ? -10 : 0;
        
        const overallScore = Math.max(0, Math.min(100, 
          (completionRate * 0.4) + 
          (averageScore * 0.3) + 
          certificationBonus + 
          compliancePenalty
        ));

        scorecardData.push({
          employee,
          totalTrainings,
          completedTrainings,
          inProgressTrainings,
          certificatesEarned,
          certificatesExpiring,
          averageScore,
          lastTrainingDate,
          complianceStatus,
          overallScore: Math.round(overallScore),
        });
      }

      setScorecards(scorecardData);
      toast({
        title: "Success",
        description: `Generated scorecards for ${scorecardData.length} employee(s)`,
      });

      return { data: scorecardData, error: null };
    } catch (error: any) {
      console.error('Error generating scorecards:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate scorecards",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setGenerating(false);
    }
  };

  const filterEmployees = (filters: {
    department?: string;
    name?: string;
    complianceStatus?: string;
    minScore?: number;
    maxScore?: number;
    hasExpiring?: boolean;
  }) => {
    return employees.filter(employee => {
      // Find corresponding scorecard data if available
      const scorecard = scorecards.find(s => s.employee.id === employee.id);
      
      if (filters.department && employee.department_id !== filters.department) {
        return false;
      }
      
      if (filters.name && !employee.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      
      if (scorecard) {
        if (filters.complianceStatus && scorecard.complianceStatus !== filters.complianceStatus) {
          return false;
        }
        
        if (filters.minScore !== undefined && scorecard.overallScore < filters.minScore) {
          return false;
        }
        
        if (filters.maxScore !== undefined && scorecard.overallScore > filters.maxScore) {
          return false;
        }
        
        if (filters.hasExpiring && scorecard.certificatesExpiring === 0) {
          return false;
        }
      }
      
      return true;
    });
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    scorecards,
    loading,
    generating,
    generateScorecards,
    filterEmployees,
    refetch: fetchEmployees,
  };
}