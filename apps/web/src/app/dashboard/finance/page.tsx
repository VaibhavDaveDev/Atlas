'use client';

import { AppShell } from '@/components/layout/AppShell';
import { 
  Landmark, 
  FileText, 
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Receipt,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Link from 'next/link';
import { getDashboardStats } from '@/lib/finance';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(res => {
        if (res.success) setStats(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis = stats?.kpis || { totalRevenue: 0, netProfit: 0, overdueInvoices: 0, treasury: 0 };
  const chartData = stats?.chartData || [];
  const recentActivity = stats?.recentActivity || [];

  return (
    <AppShell>
      <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Financial Command Center</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Real-time health monitoring and treasury management.
              {!loading && (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  System Balanced
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/finance/journals?new=true">
              <Button variant="outline" className="h-10">Record JE</Button>
            </Link>
            <Link href="/dashboard/finance/invoices?new=true">
              <Button className="h-10 bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]">Create Invoice</Button>
            </Link>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-[#d3cec6] dark:border-[#27272a] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">${kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="flex items-center mt-1 text-xs text-green-600 font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live from GL
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600/20" />
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-[#d3cec6] dark:border-[#27272a] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">${kpis.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="flex items-center mt-1 text-xs text-blue-600 font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                Current Period
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600/20" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-[#d3cec6] dark:border-[#27272a] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Overdue AR</CardTitle>
              <Receipt className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{kpis.overdueInvoices}</div>
              <div className="flex items-center mt-1 text-xs text-amber-600 font-medium">
                Invoices needing attention
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600/20" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-[#d3cec6] dark:border-[#27272a] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Treasury</CardTitle>
              <Landmark className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">${kpis.treasury.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="flex items-center mt-1 text-xs text-purple-600 font-medium">
                Cash & Bank Balances
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600/20" />
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
          {/* Main Chart */}
          <Card className="lg:col-span-8 border-[#d3cec6] dark:border-[#27272a]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Income & Expenditure</CardTitle>
                <CardDescription>Monthly financial performance tracking</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                  <div className="h-2 w-2 rounded-full bg-green-500" /> Income
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <div className="h-2 w-2 rounded-full bg-purple-500" /> Expenditure
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full mt-4">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-[#27272a]" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#71717a' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#71717a' }} 
                        tickFormatter={(value: number) => `$${value/1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid #d3cec6', 
                          backgroundColor: '#ffffff',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          color: '#111111'
                        }}
                        labelStyle={{ color: '#111111', fontWeight: 'bold', marginBottom: '4px' }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#22c55e" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                        name="Income"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#a855f7" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorExp)" 
                        name="Expenditure"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-4 border-[#d3cec6] dark:border-[#27272a]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Ledger Activity</CardTitle>
              <Link href="/dashboard/finance/journals">
                <Button variant="ghost" size="sm" className="text-xs h-8">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentActivity.length === 0 && !loading && (
                  <div className="py-12 text-center text-muted-foreground italic text-sm">
                    No recent activity found.
                  </div>
                )}
                {recentActivity.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer" onClick={() => window.location.href = `/dashboard/finance/journals`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 bg-green-50 dark:bg-green-950/30 text-green-600`}>
                        <ArrowDownLeft className="h-5 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold leading-none tracking-tight">{item.name}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          {item.type} • {formatDistanceToNow(new Date(item.date))} ago
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-mono font-bold text-[#111111] dark:text-[#f4f4f5]`}>
                        {item.amount}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-[#f5f1ec] dark:bg-[#09090b] p-6 border border-[#d3cec6] dark:border-[#27272a]">
                <h4 className="text-sm font-bold mb-2">Month-end Close</h4>
                <p className="text-xs text-muted-foreground mb-4">Maintain strict period control and reconciliation.</p>
                <Button 
                  className="w-full bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] text-xs h-9"
                  onClick={() => toast.info("Feature coming soon")}
                >
                  Start Closing Flow
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Grid */}
        <div className="grid gap-4 md:grid-cols-3">
           <Link href="/dashboard/finance/accounts" className="block">
             <Card className="hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-colors cursor-pointer border-[#d3cec6] dark:border-[#27272a]">
               <CardHeader className="pb-2">
                 <Landmark className="h-5 w-5 mb-2 text-[#7b7b78]" />
                 <CardTitle className="text-sm font-bold">Chart of Accounts</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-xs text-muted-foreground">Manage organizational ledger hierarchy and real-time balances.</p>
               </CardContent>
             </Card>
           </Link>
           <Link href="/dashboard/finance/reports/profit-loss" className="block">
             <Card className="hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-colors cursor-pointer border-[#d3cec6] dark:border-[#27272a]">
               <CardHeader className="pb-2">
                 <FileText className="h-5 w-5 mb-2 text-[#7b7b78]" />
                 <CardTitle className="text-sm font-bold">Financial Statements</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-xs text-muted-foreground">Generate P&L, Balance Sheets, and Cash Flow statements instantly.</p>
               </CardContent>
             </Card>
           </Link>
           <Link href="/dashboard/finance/payments" className="block">
             <Card className="hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-colors cursor-pointer border-[#d3cec6] dark:border-[#27272a]">
               <CardHeader className="pb-2">
                 <Wallet className="h-5 w-5 mb-2 text-[#7b7b78]" />
                 <CardTitle className="text-sm font-bold">Treasury & Bank</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-xs text-muted-foreground">Monitor cash flows and perform bank reconciliation tasks.</p>
               </CardContent>
             </Card>
           </Link>
        </div>
      </div>
    </AppShell>
  );
}
