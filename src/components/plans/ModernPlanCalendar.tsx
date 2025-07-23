import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, X } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isToday, isSameDay, addDays, startOfMonth, endOfMonth, addMonths, addDays as addDaysUtil } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Session = Tables<'sessions'> & {
  course?: Tables<'courses'>;
  plan?: Tables<'plans'>;
};

type ViewType = 'day' | 'week' | 'month' | 'agenda';

interface ModernPlanCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

const timeSlots = [
  '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM',
  '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM'
];

const eventColors = [
  'bg-red-100 border-red-200 text-red-800',
  'bg-blue-100 border-blue-200 text-blue-800',
  'bg-green-100 border-green-200 text-green-800',
  'bg-yellow-100 border-yellow-200 text-yellow-800',
  'bg-purple-100 border-purple-200 text-purple-800',
  'bg-pink-100 border-pink-200 text-pink-800',
  'bg-indigo-100 border-indigo-200 text-indigo-800',
];

export function ModernPlanCalendar({ isOpen, onClose }: ModernPlanCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('week');
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
      case 'day':
        return {
          start: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
          end: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59)
        };
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return { start: weekStart, end: weekEnd };
      case 'month':
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return { start: monthStart, end: monthEnd };
      case 'agenda':
        const agendaStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const agendaEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, currentDate.getDate());
        return { start: agendaStart, end: agendaEnd };
      default:
        return getWeekRange();
    }
  };

  const getWeekRange = () => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return { start, end };
  };

  const navigate = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'day':
        setCurrentDate(prev => direction === 'next' ? addDaysUtil(prev, 1) : addDaysUtil(prev, -1));
        break;
      case 'week':
        setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : addWeeks(prev, -1));
        break;
      case 'month':
        setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : addMonths(prev, -1));
        break;
      case 'agenda':
        setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : addMonths(prev, -1));
        break;
    }
  };

  const getDateTitle = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const { start, end } = getWeekRange();
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'agenda':
        return 'Agenda';
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  const getSessionsForDateTime = (date: Date, hour: number) => {
    return sessions.filter(session => {
      const sessionStart = new Date(session.start_date);
      const sessionDate = new Date(sessionStart.getFullYear(), sessionStart.getMonth(), sessionStart.getDate());
      const sessionHour = sessionStart.getHours();
      
      return isSameDay(sessionDate, date) && sessionHour === hour;
    });
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => {
      const sessionStart = new Date(session.start_date);
      return isSameDay(sessionStart, date);
    });
  };

  const getSessionColor = (sessionId: string) => {
    const colorIndex = sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % eventColors.length;
    return eventColors[colorIndex];
  };

  const renderWeekView = () => {
    const { start } = getWeekRange();
    const weekDays = eachDayOfInterval({ start, end: addDays(start, 6) });

    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Time column */}
        <div className="w-20 flex-shrink-0 border-r border-border">
          <div className="h-16 border-b border-border"></div>
          {timeSlots.map((time) => (
            <div key={time} className="h-16 border-b border-border flex items-start justify-center pt-2">
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 min-w-full">
            {/* Day headers */}
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`h-16 border-b border-r border-border flex flex-col items-center justify-center ${
                  isToday(day) ? 'bg-primary/5' : ''
                }`}
              >
                <div className="text-xs text-muted-foreground uppercase">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-2xl font-medium ${
                    isToday(day) ? 'text-primary bg-primary rounded-full w-8 h-8 flex items-center justify-center text-primary-foreground' : ''
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}

            {/* Time slots grid */}
            {timeSlots.map((_, hourIndex) => (
              weekDays.map((day) => (
                <div
                  key={`${day.toISOString()}-${hourIndex}`}
                  className="h-16 border-b border-r border-border p-1 relative"
                >
                  {getSessionsForDateTime(day, hourIndex + 6).map((session) => (
                    <div
                      key={session.id}
                      className={`absolute inset-1 rounded-md border-l-4 p-2 ${getSessionColor(session.id)}`}
                    >
                      <div className="text-xs font-medium truncate">
                        {session.title}
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {format(new Date(session.start_date), 'h:mm a')}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Time column */}
        <div className="w-20 flex-shrink-0 border-r border-border">
          <div className="h-16 border-b border-border"></div>
          {timeSlots.map((time) => (
            <div key={time} className="h-16 border-b border-border flex items-start justify-center pt-2">
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            {/* Day header */}
            <div
              className={`h-16 border-b border-border flex flex-col items-center justify-center ${
                isToday(dayStart) ? 'bg-primary/5' : ''
              }`}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {format(dayStart, 'EEEE')}
              </div>
              <div
                className={`text-2xl font-medium ${
                  isToday(dayStart) ? 'text-primary bg-primary rounded-full w-8 h-8 flex items-center justify-center text-primary-foreground' : ''
                }`}
              >
                {format(dayStart, 'd')}
              </div>
            </div>

            {/* Time slots */}
            {timeSlots.map((_, hourIndex) => (
              <div
                key={hourIndex}
                className="h-16 border-b border-border p-1 relative"
              >
                {getSessionsForDateTime(dayStart, hourIndex + 6).map((session) => (
                  <div
                    key={session.id}
                    className={`absolute inset-1 rounded-md border-l-4 p-2 ${getSessionColor(session.id)}`}
                  >
                    <div className="text-xs font-medium truncate">
                      {session.title}
                    </div>
                    <div className="text-xs opacity-75 truncate">
                      {format(new Date(session.start_date), 'h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map(day => (
            <div key={day.toISOString()} className="min-h-[120px] p-1 border border-border rounded">
              <div className={`text-sm mb-2 ${isToday(day) ? 'font-bold text-primary' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {getSessionsForDate(day).slice(0, 3).map(session => (
                  <div key={session.id} className={`text-xs p-1 rounded truncate ${getSessionColor(session.id)}`}>
                    {session.title}
                  </div>
                ))}
                {getSessionsForDate(day).length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{getSessionsForDate(day).length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    return (
      <div className="p-4 space-y-3">
        {sessions.length > 0 ? (
          sessions.map(session => (
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
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
            <p>No sessions scheduled</p>
          </div>
        )}
      </div>
    );
  };

  const renderCalendarContent = () => {
    switch (view) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      case 'agenda':
        return renderAgendaView();
      default:
        return renderWeekView();
    }
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
      <div className="h-full flex">
        {/* Sidebar */}
        <div className="w-64 bg-muted border-r border-border p-4 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Training Calendar</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Mini calendar */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">{format(currentDate, 'MMMM yyyy')}</div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-muted-foreground p-1">
                  {day}
                </div>
              ))}
              {/* Simplified mini calendar */}
              {Array.from({ length: 35 }, (_, i) => (
                <div key={i} className="text-center p-1 text-xs hover:bg-accent rounded cursor-pointer">
                  {i + 1 <= 31 ? i + 1 : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar list */}
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-3">My Calendars</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Training Sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Team Meetings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Evaluations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main calendar area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <h1 className="text-xl font-semibold">
                {getDateTitle()}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button className="bg-gradient-primary hover:bg-primary-hover">
                New Event
              </Button>
              <Select value={view} onValueChange={(value: ViewType) => setView(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderCalendarContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}