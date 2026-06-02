'use client';

import { useEffect, useState } from 'react';
import { Award, CheckCircle2, Send, Star } from 'lucide-react';
import { getCurrentAppraisal, submitSelfAppraisal } from '@/lib/ess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function EssAppraisalsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selfRatings, setSelfRatings] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [overallComments, setOverallComments] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getCurrentAppraisal();
        setData(result);
        if (result?.goals) {
          const initialRatings: Record<string, number> = {};
          const initialRemarks: Record<string, string> = {};
          result.goals.forEach((g: any) => {
            initialRatings[g.id] = g.selfRating || 0;
            initialRemarks[g.id] = g.employeeRemarks || '';
          });
          setSelfRatings(initialRatings);
          setRemarks(initialRemarks);
          setOverallComments(result.appraisal?.employeeComments || '');
        }
      } catch (error) {
        console.error('Failed to fetch appraisal data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!data?.appraisal) return;
    setSubmitting(true);
    try {
      const goalsUpdate = Object.keys(selfRatings).map(id => ({
        id,
        selfRating: selfRatings[id],
        employeeRemarks: remarks[id],
      }));

      // Calculate simple average for self-score
      const ratings = Object.values(selfRatings).filter(r => r > 0);
      const selfScore = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 0;

      await submitSelfAppraisal(data.appraisal.id, {
        goals: goalsUpdate,
        selfScore: parseFloat(selfScore as string),
        employeeComments: overallComments,
      });
      toast.success('Self-appraisal submitted successfully!');
      // Refresh data
      const updated = await getCurrentAppraisal();
      setData(updated);
    } catch (error) {
      toast.error('Failed to submit appraisal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading appraisal data...</div>;

  if (!data?.cycle) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <Award className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">No Active Appraisal Cycle</h2>
        <p className="text-muted-foreground">There is no performance review cycle currently active for your workspace.</p>
      </div>
    );
  }

  const isSubmitted = data.appraisal?.status !== 'DRAFT';

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" /> Performance Review
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cycle: <span className="font-semibold text-foreground">{data.cycle.name}</span> 
            ({new Date(data.cycle.startDate).toLocaleDateString()} - {new Date(data.cycle.endDate).toLocaleDateString()})
          </p>
        </div>
        <Badge variant={isSubmitted ? "success" : "outline"} className="h-6">
          {isSubmitted ? 'Self-Assessment Submitted' : 'Pending Self-Assessment'}
        </Badge>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Your Goals</h2>
        {data.goals?.map((goal: any) => (
          <Card key={goal.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{goal.title}</CardTitle>
                <Badge variant="secondary">Weightage: {Number(goal.weightage)}%</Badge>
              </div>
              <CardDescription>{goal.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Self Rating (1-5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        disabled={isSubmitted}
                        onClick={() => setSelfRatings(prev => ({ ...prev, [goal.id]: star }))}
                        className={`transition-colors ${selfRatings[goal.id] >= star ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-300'} ${(selfRatings[goal.id] || 0) >= star ? 'fill-amber-500' : ''}`}
                      >
                        <Star className="h-6 w-6" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Your Remarks</label>
                  <Input 
                    placeholder="Describe your achievements..." 
                    value={remarks[goal.id] || ''}
                    disabled={isSubmitted}
                    onChange={(e) => setRemarks(prev => ({ ...prev, [goal.id]: e.target.value }))}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Comments</CardTitle>
          <CardDescription>Summarize your overall performance and growth during this cycle.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="What were your biggest challenges and successes?"
            value={overallComments}
            disabled={isSubmitted}
            onChange={(e) => setOverallComments(e.target.value)}
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {!isSubmitted && (
        <div className="flex justify-end">
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : <><Send className="h-4 w-4 mr-2" /> Submit Self-Appraisal</>}
          </Button>
        </div>
      )}

      {isSubmitted && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Your self-assessment has been submitted and is currently being reviewed by your manager.</span>
        </div>
      )}
    </div>
  );
}
