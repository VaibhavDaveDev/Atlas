'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Terminal, Activity, Search, RefreshCw, AlertCircle, Server, History } from 'lucide-react';
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminLogsPage() {
  const { workspace } = useAuth();
  const [activeTab, setActiveTab] = useState('activity');
  const [isLoading, setIsLoading] = useState(false);
  
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actorId, setActorId] = useState('');

  useEffect(() => {
    loadLogs();
  }, [activeTab, workspace]);

  const loadLogs = async () => {
    if (!workspace) return;
    setIsLoading(true);
    try {
      let endpoint = '';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (actorId) params.append('userId', actorId);
      
      const query = params.toString() ? `?${params.toString()}` : '';

      if (activeTab === 'activity') {
        endpoint = `/api/v1/logs/activity/${workspace.workspaceId}${query}`;
      } else if (activeTab === 'audit') {
        endpoint = `/api/v1/logs/audit/${workspace.workspaceId}${query}`;
      }
      
      const token = tokenStorage.getBetterAuthToken();
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-workspace-id': workspace.workspaceId,
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      
      if (activeTab === 'activity') {
        setActivityLogs(data.logs || []);
      } else if (activeTab === 'audit') {
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivityLogs = activityLogs.filter(log => 
    log.entityType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log => 
    log.entity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <TabsTrigger value="audit" className="px-6 flex items-center gap-2">
              <History className="h-4 w-4" /> Audit Trail (Immutable)
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Input
              type="date"
              className="w-[150px]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <Input
              type="date"
              className="w-[150px]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
            <Input
              placeholder="Actor ID"
              className="w-[150px]"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
            />
            <Button variant="secondary" onClick={loadLogs} disabled={isLoading}>
              Apply Filters
            </Button>
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
                          <TableCell className="text-xs text-muted-foreground font-mono">{log.userId?.split('-')[0] || 'Unknown'}...</TableCell>
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

          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium">Immutable Audit Trail</CardTitle>
                    <CardDescription>SOC 2 compliant, tamper-evident logs stored in TimescaleDB.</CardDescription>
                  </div>
                  {!workspace?.isAuditEnabled && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50">
                      AUDITING DISABLED
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right pr-6">Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Loading compliance logs...</TableCell>
                      </TableRow>
                    ) : filteredAuditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          {workspace?.isAuditEnabled 
                            ? "No audit records found." 
                            : "Enable auditing in Security Settings to start recording compliance logs."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="pl-6 font-medium">
                            <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            <div className="flex flex-col">
                              <span>{log.entity}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{log.entityId?.slice(0, 8)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">{log.userId?.split('-')[0] || 'System'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Badge variant="secondary" className="text-[9px] cursor-help" title={JSON.stringify(log.details)}>
                              JSON DATA
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
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
