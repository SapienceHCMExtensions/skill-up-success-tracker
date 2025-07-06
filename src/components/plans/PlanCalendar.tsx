import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, addWeeks, addMonths, addQuarters, addYears, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Session = Tables<'sessions'> & {
  course?: Tables<'courses'>;
  plan?: Tables<'plans'>;
};

type ViewType = 'week' | 'month' | 'quarter' | 'year';

interface PlanCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlanCalendar({ isOpen, onClose }: PlanCalendarProps) {
  const [view, setView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          course:courses(*),
          plan:plans(*)
        `)
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString())
        .order('start_date');

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    switch (view) {
      case 'week':
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
        };
      case 'month':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
      case 'quarter':
        return {
          start: startOfQuarter(currentDate),
          end: endOfQuarter(currentDate),
        };
      case 'year':
        return {
          start: startOfYear(currentDate),
          end: endOfYear(currentDate),
        };
      default:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'week':
        setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : addWeeks(prev, -1));
        break;
      case 'month':
        setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : addMonths(prev, -1));
        break;
      case 'quarter':
        setCurrentDate(prev => direction === 'next' ? addQuarters(prev, 1) : addQuarters(prev, -1));
        break;
      case 'year':
        setCurrentDate(prev => direction === 'next' ? addYears(prev, 1) : addYears(prev, -1));
        break;
    }
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => {
      const sessionStart = new Date(session.start_date);
      const sessionEnd = new Date(session.end_date);
      return date >= sessionStart && date <= sessionEnd;
    });
  };

  const getDateTitle = () => {
    switch (view) {
      case 'week':
        const { start, end } = getDateRange();
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'quarter':
        return `Q${Math.ceil((currentDate.getMonth() + 1) / 3)} ${currentDate.getFullYear()}`;
      case 'year':
        return format(currentDate, 'yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  const renderCalendarGrid = () => {
    const { start, end } = getDateRange();
    const days = eachDayOfInterval({ start, end });

    if (view === 'week') {
      return (
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => (
            <div key={day.toISOString()} className="min-h-[120px] p-2 border rounded-lg">
              <div className={`text-sm font-medium mb-2 ${isToday(day) ? 'text-primary' : ''}`}>
                {format(day, 'EEE d')}
              </div>
              <div className="space-y-1">
                {getSessionsForDate(day).map(session => (
                  <div key={session.id} className="text-xs p-1 bg-primary/10 text-primary rounded truncate">
                    {session.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (view === 'month') {
      return (
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map(day => (
            <div key={day.toISOString()} className="min-h-[80px] p-1 border-b border-r">
              <div className={`text-sm ${isToday(day) ? 'font-bold text-primary' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5 mt-1">
                {getSessionsForDate(day).slice(0, 2).map(session => (
                  <div key={session.id} className="text-xs p-0.5 bg-primary/10 text-primary rounded truncate">
                    {session.title}
                  </div>
                ))}
                {getSessionsForDate(day).length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{getSessionsForDate(day).length - 2} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Quarter and Year views show list format
    return (
      <div className="space-y-3">
        {sessions.map(session => (
          <Card key={session.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{session.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {session.plan?.name}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {format(new Date(session.start_date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(session.start_date), 'h:mm a')}
                  </div>
                  {session.location && (
                    <span>{session.location}</span>
                  )}
                </div>
              </div>
              <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                {session.status}
              </Badge>
            </div>
          </Card>
        ))}
        {sessions.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
            <p>No sessions scheduled for this period</p>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (isOpen) {
      const { start, end } = getDateRange();
      fetchSessions(start, end);
    }
  }, [isOpen, currentDate, view]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container mx-auto p-4 h-full flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Training Calendar
              </CardTitle>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-lg font-medium min-w-[200px] text-center">
                  {getDateTitle()}
                </h3>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <Select value={view} onValueChange={(value: ViewType) => setView(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderCalendarGrid()
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}