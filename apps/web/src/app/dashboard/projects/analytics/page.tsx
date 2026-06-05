'use client';

import { AppShell } from '@/components/layout/AppShell';
import { BarChart3, TrendingUp, Users, Target, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import { getProjects } from '@/lib/projects';
import { Loader2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

export default function ProjectAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getProjects();
        setProjects(res.data || res || []);
      } catch (error) {
        console.error('Failed to fetch projects', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const projectStatusData = useMemo(() => {
    const counts: Record<string, number> = {
      'PLANNING': 0,
      'IN_PROGRESS': 0,
      'ON_HOLD': 0,
      'COMPLETED': 0,
      'CANCELLED': 0,
    };
    projects.forEach(p => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const budgetData = useMemo(() => {
    return projects.slice(0, 5).map(p => ({
      name: p.projectCode,
      budget: Number(p.budgetAmount || 0),
      actual: Number(p.actualCost || 0),
    }));
  }, [projects]);

  const COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const inProgressProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
  
  const totalBudget = projects.reduce((acc, p) => acc + Number(p.budgetAmount || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + Number(p.actualCost || 0), 0);

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Project Intelligence</h1>
          <p className="text-muted-foreground text-sm">Advanced analytics and performance metrics across your workspace.</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-sm bg-white dark:bg-[#09090b]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Overall completion velocity</p>
            </CardContent>
          </Card>
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-sm bg-white dark:bg-[#09090b]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resource Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Budget vs. Actual expenditure</p>
            </CardContent>
          </Card>
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-sm bg-white dark:bg-[#09090b]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Workload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{inProgressProjects}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Projects currently in flight</p>
            </CardContent>
          </Card>
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-sm bg-white dark:bg-[#09090b]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg. Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {totalProjects > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progressPercent || 0), 0) / totalProjects) : 0}%
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Across all tracked initiatives</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-sm bg-[#fdfcfb] dark:bg-[#09090b]">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" /> Status Distribution
              </CardTitle>
              <CardDescription>Breakdown of projects by lifecycle stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-sm bg-[#fdfcfb] dark:bg-[#09090b]">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" /> Budget Utilization
              </CardTitle>
              <CardDescription>Comparison of planned budget vs. actual cost</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
