import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCourseEvaluations } from '@/hooks/useCourseEvaluations';
import { useCourses } from '@/hooks/useCourses';
import { useTrainingRequests } from '@/hooks/useTrainingRequests';
import { Star } from 'lucide-react';

interface EvaluationFormData {
  course_id: string;
  training_request_id?: string;
  overall_rating: number;
  course_content_rating: number;
  instructor_rating: number;
  relevance_rating: number;
  learning_objectives: string;
  course_feedback: string;
  recommendations: string;
}

export function CourseEvaluationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createEvaluation } = useCourseEvaluations();
  const { courses } = useCourses();
  const { requests } = useTrainingRequests();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EvaluationFormData>();

  const selectedCourse = watch('course_id');
  const overallRating = watch('overall_rating');

  const onSubmit = async (data: EvaluationFormData) => {
    setIsSubmitting(true);
    try {
      const responses = {
        course_content_rating: data.course_content_rating,
        instructor_rating: data.instructor_rating,
        relevance_rating: data.relevance_rating,
        learning_objectives: data.learning_objectives,
        course_feedback: data.course_feedback,
        recommendations: data.recommendations,
      };

      await createEvaluation(
        data.course_id, 
        'default-template', // You might want to make this dynamic
        responses, 
        data.overall_rating,
        data.training_request_id
      );
      reset();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, name }: { value: number; onChange: (value: number) => void; name: string }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`p-1 rounded ${star <= value ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Evaluation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Select onValueChange={(value) => setValue('course_id', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select course to evaluate" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course_id && (
                <span className="text-sm text-destructive">Course is required</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="training_request">Related Training Request (Optional)</Label>
              <Select onValueChange={(value) => setValue('training_request_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select training request" />
                </SelectTrigger>
                <SelectContent>
                  {requests.map((request) => (
                    <SelectItem key={request.id} value={request.id}>
                      {request.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Overall Course Rating *</Label>
              <StarRating 
                value={overallRating || 0} 
                onChange={(value) => setValue('overall_rating', value)} 
                name="overall_rating"
              />
            </div>

            <div className="space-y-2">
              <Label>Course Content Quality</Label>
              <StarRating 
                value={watch('course_content_rating') || 0} 
                onChange={(value) => setValue('course_content_rating', value)} 
                name="course_content_rating"
              />
            </div>

            <div className="space-y-2">
              <Label>Instructor Effectiveness</Label>
              <StarRating 
                value={watch('instructor_rating') || 0} 
                onChange={(value) => setValue('instructor_rating', value)} 
                name="instructor_rating"
              />
            </div>

            <div className="space-y-2">
              <Label>Relevance to Job Role</Label>
              <StarRating 
                value={watch('relevance_rating') || 0} 
                onChange={(value) => setValue('relevance_rating', value)} 
                name="relevance_rating"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="learning_objectives">Were the learning objectives met?</Label>
              <Textarea
                id="learning_objectives"
                {...register('learning_objectives')}
                placeholder="Please describe how well the course met the stated learning objectives..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course_feedback">Course Feedback</Label>
              <Textarea
                id="course_feedback"
                {...register('course_feedback')}
                placeholder="What did you like most about the course? What could be improved?"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Would you recommend this course?</Label>
              <Textarea
                id="recommendations"
                {...register('recommendations')}
                placeholder="Would you recommend this course to colleagues? Why or why not?"
                rows={3}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || !selectedCourse || !overallRating} className="w-full">
            {isSubmitting ? 'Submitting Evaluation...' : 'Submit Course Evaluation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}