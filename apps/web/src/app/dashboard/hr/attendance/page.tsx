'use client';

import { useState, useEffect } from 'react';
import { Clock, Download, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getAttendanceLogs } from '@/lib/hr';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function HrAttendanceLogsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const logsRes = await getAttendanceLogs();
      setLogs(logsRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load attendance logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = () => {
    toast.success('Exporting attendance logs...');
    // Simple CSV export logic
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Employee,Date,Check In,Check Out,Status,Hours\n"
      + logs.map(log => {
          return `${log.employee?.fullName},${format(new Date(log.attendanceDate), 'yyyy-MM-dd')},${log.checkIn ? format(new Date(log.checkIn), 'HH:mm:ss') : ''},${log.checkOut ? format(new Date(log.checkOut), 'HH:mm:ss') : ''},${log.status},${log.workingHours ? Number(log.workingHours).toFixed(2) : ''}`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => 
    log.employee?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.employee?.employeeNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Company Attendance
            </h1>
            <p className="text-sm text-muted-foreground">Monitor and manage employee daily attendance logs.</p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>View check-ins, check-outs, and working hours for all employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name or number..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No attendance logs found matching your criteria.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-muted-foreground">
                        <th className="py-3 px-4 text-left font-medium">Employee</th>
                        <th className="py-3 px-4 text-left font-medium">Date</th>
                        <th className="py-3 px-4 text-left font-medium">Check In</th>
                        <th className="py-3 px-4 text-left font-medium">Check Out</th>
                        <th className="py-3 px-4 text-left font-medium">Status</th>
                        <th className="py-3 px-4 text-right font-medium">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-foreground">{log.employee?.fullName || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{log.employee?.employeeNumber}</div>
                          </td>
                          <td className="py-3 px-4">{format(new Date(log.attendanceDate), 'MMM d, yyyy')}</td>
                          <td className="py-3 px-4 text-emerald-500 font-medium">
                            {log.checkIn ? format(new Date(log.checkIn), 'HH:mm a') : '-'}
                          </td>
                          <td className="py-3 px-4 text-blue-500 font-medium">
                            {log.checkOut ? format(new Date(log.checkOut), 'HH:mm a') : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              log.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                              log.status === 'ABSENT' ? 'bg-red-50 text-red-700 ring-red-600/20' : 
                              'bg-gray-50 text-gray-600 ring-gray-500/10'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {log.workingHours ? Number(log.workingHours).toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
