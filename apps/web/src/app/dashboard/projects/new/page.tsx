'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createProject } from '@/lib/projects';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectCode: '',
    projectName: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    budgetAmount: '',
  });

  const generateRandomCode = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    setFormData({ ...formData, projectCode: `PRJ-${year}-${random}` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createProject({
        ...formData,
        budgetAmount: formData.budgetAmount ? parseFloat(formData.budgetAmount) : undefined,
      });
      toast.success('Project created successfully');
      router.push('/dashboard/projects');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Initiate New Project</h1>
          <p className="text-muted-foreground mt-1">Define the foundation for your next big venture.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
              <CardDescription>Enter the core information about the project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="projectCode">Project Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="projectCode"
                    placeholder="e.g. PRJ-2024-001"
                    required
                    value={formData.projectCode}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                    className="bg-transparent flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={generateRandomCode}
                    className="shrink-0 border-[#d3cec6] dark:border-[#27272a] h-10 w-10 bg-[#fdfcfb] dark:bg-[#09090b]"
                    title="Generate random code"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g. Q3 Infrastructure Overhaul"
                  required
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="bg-transparent"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this project about?"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-transparent"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="budgetAmount">Budget Amount</Label>
                  <Input
                    id="budgetAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.budgetAmount}
                    onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                    className="bg-transparent font-mono"
                  />
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <Link href="/dashboard/projects">
                <Button variant="outline" type="button" disabled={loading}>Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Project
                  </>
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}
