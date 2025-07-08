import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Calendar, Clock, MapPin, BookOpen, User, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type SessionWithDetails = Tables<'sessions'> & {
  courses?: Partial<Tables<'courses'>>;
  employees?: Partial<Tables<'employees'>>;
  session_enrollments?: (Tables<'session_enrollments'> & {
    employee?: Tables<'employees'>;
  })[];
};

interface SessionDetailsDialogProps {
  session: SessionWithDetails;
  onUpdate: () => void;
  trigger: React.ReactNode;
}

export function SessionDetailsDialog({ session, onUpdate, trigger }: SessionDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchSessionDetails();
    }
  }, [open, session.id]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          courses (
            title,
            code,
            duration_hours,
            description,
            competencies
          ),
          employees:instructor_id (
            name,
            email
          ),
          session_enrollments (
            *,
            employee:employees (
              name,
              email,
              department_id
            )
          )
        `)
        .eq('id', session.id)
        .single();

      if (error) throw error;
      setSessionDetails(data as any);
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch session details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEnrollmentStatus = async (enrollmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('session_enrollments')
        .update({ 
          status: status as any,
          completion_date: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Enrollment status updated",
      });

      fetchSessionDetails();
      onUpdate();
    } catch (error: any) {
      console.error('Error updating enrollment status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-white">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning text-white">In Progress</Badge>;
      case 'not_completed':
        return <Badge variant="destructive">Not Completed</Badge>;
      case 'absent':
        return <Badge variant="outline">Absent</Badge>;
      default:
        return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  const getSessionStatusBadge = () => {
    if (!sessionDetails) return null;
    
    const now = new Date();
    const startDate = new Date(sessionDetails.start_date);
    const endDate = new Date(sessionDetails.end_date);

    if (sessionDetails.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    } else if (endDate < now) {
      return <Badge className="bg-success text-white">Completed</Badge>;
    } else if (startDate <= now && endDate >= now) {
      return <Badge className="bg-warning text-white">In Progress</Badge>;
    } else {
      return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  const getCompletionStats = () => {
    if (!sessionDetails?.session_enrollments) return { completed: 0, total: 0, percentage: 0 };
    
    const total = sessionDetails.session_enrollments.length;
    const completed = sessionDetails.session_enrollments.filter(e => e.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  if (!sessionDetails && !loading) return null;

  const stats = getCompletionStats();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{sessionDetails?.title || session.title}</DialogTitle>
              <p className="text-muted-foreground mt-1">
                {sessionDetails?.courses?.code} • {sessionDetails?.courses?.title}
              </p>
            </div>
            {getSessionStatusBadge()}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading session details...</div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="enrollments">Enrollments ({sessionDetails?.session_enrollments?.length || 0})</TabsTrigger>
              <TabsTrigger value="course-info">Course Info</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Completion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.percentage}%</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.completed} of {stats.total} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Enrollment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {sessionDetails?.session_enrollments?.length || 0} / {sessionDetails?.max_seats || '∞'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enrolled participants
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sessionDetails?.courses?.duration_hours || 0}h</div>
                    <p className="text-xs text-muted-foreground">
                      Total training hours
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Session Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{new Date(sessionDetails?.start_date || '').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span>{new Date(sessionDetails?.end_date || '').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{sessionDetails?.location || 'TBD'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Seats:</span>
                      <span>{sessionDetails?.max_seats || 'Unlimited'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Instructor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessionDetails?.employees ? (
                      <div className="space-y-2">
                        <div className="font-medium">{sessionDetails.employees.name}</div>
                        <div className="text-sm text-muted-foreground">{sessionDetails.employees.email}</div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No instructor assigned</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="enrollments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Participant Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessionDetails?.session_enrollments?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2" />
                        <p>No participants enrolled yet</p>
                      </div>
                    ) : (
                      sessionDetails?.session_enrollments?.map((enrollment) => (
                        <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{enrollment.employee?.name}</div>
                            <div className="text-sm text-muted-foreground">{enrollment.employee?.email}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Select
                              value={enrollment.status || 'scheduled'}
                              onValueChange={(value) => updateEnrollmentStatus(enrollment.id, value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="not_completed">Not Completed</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                              </SelectContent>
                            </Select>
                            {getStatusBadge(enrollment.status || 'scheduled')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="course-info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Course Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">
                      {sessionDetails?.courses?.description || 'No description available'}
                    </p>
                  </div>
                  
                  {sessionDetails?.courses?.competencies && sessionDetails.courses.competencies.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Competencies</h4>
                      <div className="flex flex-wrap gap-2">
                        {sessionDetails.courses.competencies.map((competency, index) => (
                          <Badge key={index} variant="outline">{competency}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}