import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, Send, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  title: string;
  course?: {
    title: string;
  };
}

interface EvaluationFormProps {
  onSubmit: (sessionId: string, templateId: string, responses: any, rating: number) => void;
  loading?: boolean;
}

export function EvaluationForm({ onSubmit, loading }: EvaluationFormProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [responses, setResponses] = useState<{ [key: string]: any }>({});
  const [overallRating, setOverallRating] = useState<number>(5);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          course:courses(title)
        `)
        .eq('status', 'completed')
        .order('end_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch completed sessions",
        variant: "destructive",
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleQuestionResponse = (questionId: string, answer: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    if (!selectedSession) {
      toast({
        title: "Validation Error",
        description: "Please select a training session",
        variant: "destructive",
      });
      return;
    }

    // Create a simple evaluation template on the fly
    const evaluationData = {
      instructor_quality: responses.instructor_quality || 5,
      content_relevance: responses.content_relevance || 5,
      material_quality: responses.material_quality || 5,
      would_recommend: responses.would_recommend || 'yes',
      additional_comments: responses.additional_comments || '',
      most_valuable: responses.most_valuable || '',
      improvements: responses.improvements || ''
    };

    onSubmit(selectedSession, 'default-template', evaluationData, overallRating);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const questions = [
    {
      id: 'instructor_quality',
      type: 'rating',
      question: 'How would you rate the quality of instruction?',
      required: true
    },
    {
      id: 'content_relevance',
      type: 'rating',
      question: 'How relevant was the training content to your role?',
      required: true
    },
    {
      id: 'material_quality',
      type: 'rating',
      question: 'How would you rate the quality of training materials?',
      required: true
    },
    {
      id: 'would_recommend',
      type: 'choice',
      question: 'Would you recommend this training to others?',
      options: ['yes', 'no', 'maybe'],
      required: true
    },
    {
      id: 'most_valuable',
      type: 'text',
      question: 'What was the most valuable part of this training?',
      required: false
    },
    {
      id: 'improvements',
      type: 'text',
      question: 'What improvements would you suggest?',
      required: false
    },
    {
      id: 'additional_comments',
      type: 'textarea',
      question: 'Any additional comments or feedback?',
      required: false
    }
  ];

  const renderQuestion = (question: any) => {
    switch (question.type) {
      case 'rating':
        return (
          <RadioGroup
            value={responses[question.id]?.toString() || '5'}
            onValueChange={(value) => handleQuestionResponse(question.id, parseInt(value))}
            className="flex gap-4"
          >
            {[1, 2, 3, 4, 5].map(rating => (
              <div key={rating} className="flex items-center space-x-2">
                <RadioGroupItem value={rating.toString()} id={`${question.id}-${rating}`} />
                <Label htmlFor={`${question.id}-${rating}`} className="flex items-center gap-1">
                  {rating} <Star className="w-3 h-3" />
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'choice':
        return (
          <RadioGroup
            value={responses[question.id] || question.options[0]}
            onValueChange={(value) => handleQuestionResponse(question.id, value)}
            className="flex gap-4"
          >
            {question.options.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`} className="capitalize">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'text':
        return (
          <Input
            value={responses[question.id] || ''}
            onChange={(e) => handleQuestionResponse(question.id, e.target.value)}
            placeholder="Enter your response..."
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={responses[question.id] || ''}
            onChange={(e) => handleQuestionResponse(question.id, e.target.value)}
            placeholder="Enter your feedback..."
            rows={4}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Training Evaluation Form
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Session Selection */}
        <div>
          <Label htmlFor="session">Select Training Session *</Label>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a completed training session" />
            </SelectTrigger>
            <SelectContent>
              {loadingSessions ? (
                <div className="p-2 text-center text-muted-foreground">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="p-2 text-center text-muted-foreground">No completed sessions found</div>
              ) : (
                sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    <div>
                      <div className="font-medium">{session.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {session.course?.title}
                      </div>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Overall Rating */}
        <div>
          <Label>Overall Rating *</Label>
          <RadioGroup
            value={overallRating.toString()}
            onValueChange={(value) => setOverallRating(parseInt(value))}
            className="flex gap-4 mt-2"
          >
            {[1, 2, 3, 4, 5].map(rating => (
              <div key={rating} className="flex items-center space-x-2">
                <RadioGroupItem value={rating.toString()} id={`overall-${rating}`} />
                <Label htmlFor={`overall-${rating}`} className="flex items-center gap-1">
                  {rating} <Star className="w-4 h-4" />
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <Label className="text-base">
                {index + 1}. {question.question}
                {question.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderQuestion(question)}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={!selectedSession || loading}
            className="w-full bg-gradient-primary hover:bg-primary-hover"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Evaluation
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}