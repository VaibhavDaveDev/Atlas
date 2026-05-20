'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Terminal, Activity, Search, RefreshCw, AlertCircle, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { tokenStorage } from '@/lib/auth';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminLogsPage() {
  const { workspace } = useAuth();
  const [activeTab, setActiveTab] = useState('activity');
  const [isLoading, setIsLoading] = useState(false);
  
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, [activeTab, workspace]);

  const loadLogs = async () => {
    if (!workspace) return;
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'activity' 
        ? `/api/v1/logs/activity/${workspace.workspaceId}` 
        : '/api/v1/logs/system';
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      
      if (activeTab === 'activity') {
        setActivityLogs(data.logs || []);
      } else {
        setSystemLogs(data.logs || []);
      }
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivityLogs = activityLogs.filter(log => 
    log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSystemLogs = systemLogs.filter(log => 
    log.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Logs & Audit</h1>
            <p className="text-muted-foreground">Monitor system activity and application logs.</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </Button>
        </div>

        <Tabs defaultValue="activity" onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="activity" className="px-6 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Activity Logs
            </TabsTrigger>
            <TabsTrigger value="system" className="px-6 flex items-center gap-2">
              <Terminal className="h-4 w-4" /> System Logs (Loki)
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Workspace Activity</CardTitle>
                <CardDescription>Detailed audit trail of all changes within the workspace.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right pr-6">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && activityLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                      </TableRow>
                    ) : filteredActivityLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No activity logs found.</TableCell>
                      </TableRow>
                    ) : (
                      filteredActivityLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="pl-6 font-medium">
                            <Badge variant={log.action === 'DELETE' ? 'destructive' : log.action === 'CREATE' ? 'default' : 'secondary'} className="text-[10px]">
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{log.entityType}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">{log.userId.split('-')[0]}...</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right pr-6 text-xs text-muted-foreground font-mono">
                            {log.ipAddress || 'Internal'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="mt-4">
            <Card className="bg-slate-950 text-slate-50 border-slate-800">
              <CardHeader className="border-b border-slate-800 pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Server className="h-4 w-4" /> Real-time Application Logs
                    </CardTitle>
                    <CardDescription className="text-slate-400">Streaming directly from Grafana Loki.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-green-500/50 text-green-400 text-[10px]">
                    LOKI CONNECTED
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] w-full">
                  <div className="p-4 font-mono text-xs space-y-1">
                    {isLoading && systemLogs.length === 0 ? (
                      <div className="text-slate-500 italic">Connecting to Loki...</div>
                    ) : filteredSystemLogs.length === 0 ? (
                      <div className="text-slate-500 italic">No system logs available or Loki is disabled.</div>
                    ) : (
                      filteredSystemLogs.map((log, i) => (
                        <div key={i} className="flex gap-4 hover:bg-slate-900/50 py-1 px-2 rounded group">
                          <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className="text-blue-400 shrink-0 uppercase w-12">{log.labels?.level || 'INFO'}</span>
                          <span className={`${log.message.includes('error') || log.message.includes('Error') ? 'text-red-400' : 'text-slate-300'} break-all`}>
                            {log.message}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-amber-600">
            <strong>Note for IT Admins:</strong> Loki logs are intended for system debugging. For security audits, please refer to the Activity Logs tab.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
