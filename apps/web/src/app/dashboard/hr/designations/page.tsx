'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getDesignations, createDesignation } from '@/lib/hr';
import { Loader2, Plus, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    setIsLoading(true);
    try {
      const res = await getDesignations();
      if (res.success) setDesignations(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await createDesignation({ title, description, level: parseInt(level) });
      if (res.success) {
        setDesignations(prev => [...prev, { ...res.data, _count: { employees: 0 } }]);
        setIsAdding(false);
        setTitle('');
        setDescription('');
        setLevel('1');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Designations</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage job titles and roles.
            </p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Designation
          </Button>
        </div>

        {isAdding && (
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
            <h3 className="font-semibold mb-4">Create New Designation</h3>
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="level">Seniority Level (1-10)</Label>
                <Input id="level" type="number" min="1" max="10" required value={level} onChange={e => setLevel(e.target.value)} />
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Save'}
              </Button>
            </form>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : designations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">No designations found</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                Create a designation to assign job titles to your employees.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Job Title</th>
                    <th className="px-6 py-4 font-medium">Level</th>
                    <th className="px-6 py-4 font-medium">Employees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {designations.map((desig) => (
                    <tr key={desig.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{desig.title}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{desig.level}</td>
                      <td className="px-6 py-4">{desig._count?.employees || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
