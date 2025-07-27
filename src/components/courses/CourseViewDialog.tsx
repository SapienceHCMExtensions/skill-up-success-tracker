import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Clock, DollarSign, Award, BookOpen, Users } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;

interface CourseViewDialogProps {
  course: Course;
  trigger: React.ReactNode;
}

export function CourseViewDialog({ course, trigger }: CourseViewDialogProps) {
  const getProviderBadge = (provider: string) => {
    return provider === "internal" 
      ? <Badge variant="secondary" className="bg-primary/10 text-primary">Internal</Badge>
      : <Badge variant="secondary" className="bg-accent/50 text-accent-foreground">External</Badge>
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            Course Details
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[75vh] pr-4">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {course.code}
                    </Badge>
                    {getProviderBadge(course.provider_type)}
                  </div>
                  <h2 className="text-2xl font-semibold">{course.title}</h2>
                </div>
              </div>
            </div>

            <Separator />

            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-medium">{course.duration_hours}h</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <DollarSign className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-medium">${course.default_cost || 0}</div>
                  <div className="text-xs text-muted-foreground">Cost</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Award className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-medium">{course.certificate_validity_months || 0}mo</div>
                  <div className="text-xs text-muted-foreground">Cert Valid</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Users className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-medium">0</div>
                  <div className="text-xs text-muted-foreground">Enrolled</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            {course.description && (
              <div className="space-y-3">
                <h3 className="font-medium">Description</h3>
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {course.description}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Competencies */}
            <div className="space-y-3">
              <h3 className="font-medium">Competencies</h3>
              <div className="flex flex-wrap gap-2">
                {course.competencies && course.competencies.length > 0 ? (
                  course.competencies.map((comp, index) => (
                    <Badge key={index} variant="secondary">
                      {comp}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No competencies defined</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <strong>Created:</strong> {course.created_at ? new Date(course.created_at).toLocaleDateString() : 'N/A'}
              </div>
              <div>
                <strong>Updated:</strong> {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}