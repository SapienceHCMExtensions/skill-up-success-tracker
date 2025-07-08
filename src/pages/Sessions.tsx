import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  Search, 
  Filter,
  Plus,
  Edit,
  UserPlus,
  Eye
} from 'lucide-react';
import { SessionDialog } from '@/components/training/SessionDialog';
import { SessionEnrollmentDialog } from '@/components/training/SessionEnrollmentDialog';
import { SessionDetailsDialog } from '@/components/training/SessionDetailsDialog';
import { useSessions } from '@/hooks/useSessions';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type SessionWithRelations = Tables<'sessions'> & {
  courses?: Partial<Tables<'courses'>>;
  employees?: Partial<Tables<'employees'>>;
  session_enrollments?: (Tables<'session_enrollments'> & {
    employee?: Tables<'employees'>;
  })[];
};

export default function Sessions() {
  const { sessions, loading, refetch } = useSessions();
  const [sessionsWithEnrollments, setSessionsWithEnrollments] = useState<SessionWithRelations[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSessionsWithEnrollments();
  }, [sessions]);

  const fetchSessionsWithEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          courses (
            title,
            code,
            duration_hours
          ),
          employees:instructor_id (
            name,
            email
          ),
          session_enrollments (
            *,
            employee:employees (
              name,
              email
            )
          )
        `)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setSessionsWithEnrollments(data as any || []);
    } catch (error) {
      console.error('Error fetching sessions with enrollments:', error);
    }
  };

  const getStatusBadge = (session: SessionWithRelations) => {
    const now = new Date();
    const startDate = new Date(session.start_date);
    const endDate = new Date(session.end_date);

    if (session.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    } else if (endDate < now) {
      return <Badge className="bg-success text-white">Completed</Badge>;
    } else if (startDate <= now && endDate >= now) {
      return <Badge className="bg-warning text-white">In Progress</Badge>;
    } else {
      return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  const getEnrollmentCount = (session: SessionWithRelations) => {
    return session.session_enrollments?.length || 0;
  };

  const filteredSessions = sessionsWithEnrollments.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.courses?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.courses?.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const now = new Date();
    const startDate = new Date(session.start_date);
    const endDate = new Date(session.end_date);
    
    switch (statusFilter) {
      case 'scheduled':
        return matchesSearch && startDate > now && session.status !== 'cancelled';
      case 'in_progress':
        return matchesSearch && startDate <= now && endDate >= now && session.status !== 'cancelled';
      case 'completed':
        return matchesSearch && endDate < now && session.status !== 'cancelled';
      case 'cancelled':
        return matchesSearch && session.status === 'cancelled';
      default:
        return matchesSearch;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Sessions</h1>
          <p className="text-muted-foreground mt-1">Manage all training sessions and enrollments</p>
        </div>
        <SessionDialog
          trigger={
            <Button className="bg-gradient-primary hover:bg-primary-hover">
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          }
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">Loading sessions...</div>
            </CardContent>
          </Card>
        ) : filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No sessions match your filters' 
                  : 'No sessions found'}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{session.title}</h3>
                      {getStatusBadge(session)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(session.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(session.start_date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{session.location || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{getEnrollmentCount(session)} / {session.max_seats || 'No limit'}</span>
                      </div>
                    </div>

                    {session.courses && (
                      <div className="mt-2 text-sm">
                        <span className="font-mono text-xs bg-accent px-2 py-1 rounded mr-2">
                          {session.courses.code}
                        </span>
                        <span className="text-muted-foreground">{session.courses.title}</span>
                      </div>
                    )}

                    {session.employees && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Instructor: {session.employees.name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <SessionDetailsDialog
                      session={session}
                      onUpdate={fetchSessionsWithEnrollments}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      }
                    />
                    <SessionEnrollmentDialog
                      session={session}
                      onUpdate={fetchSessionsWithEnrollments}
                      trigger={
                        <Button variant="outline" size="sm">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Enroll
                        </Button>
                      }
                    />
                    <SessionDialog
                      session={session}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}