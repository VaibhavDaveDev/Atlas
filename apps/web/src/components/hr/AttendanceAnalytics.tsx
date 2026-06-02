'use client';

import React, { useState, useMemo } from 'react';
import { useList } from '@refinedev/core';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  FileSpreadsheet,
  Download,
  Search,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Helper to calculate if an employee is late
function isLate(log: any) {
  if (!log.checkIn) return false;
  
  const checkInDate = new Date(log.checkIn);
  let expectedStartTimeStr = "09:00"; // Default
  
  // Try to find an active shift assignment
  if (log.employee?.shiftAssignments && log.employee.shiftAssignments.length > 0) {
    const activeShift = log.employee.shiftAssignments.find((sa: any) => {
      const fromDate = new Date(sa.fromDate);
      const toDate = sa.toDate ? new Date(sa.toDate) : new Date('2099-12-31');
      return checkInDate >= fromDate && checkInDate <= toDate;
    }) || log.employee.shiftAssignments[0];
    
    if (activeShift?.shiftType?.startTime) {
      expectedStartTimeStr = activeShift.shiftType.startTime;
    }
  }

  // Parse expected time (e.g. "09:00")
  const [expectedHour, expectedMin] = expectedStartTimeStr.split(':').map(Number);
  
  const expectedDate = new Date(checkInDate);
  expectedDate.setHours(expectedHour, expectedMin + 15, 0, 0); // 15 mins grace period

  return checkInDate > expectedDate;
}

export const AttendanceAnalytics: React.FC = () => {
  const listResult = useList<any>({
    resource: 'hr/attendance',
    pagination: {
        mode: 'off'
    }
  });
  const queryResult = listResult.query?.data;
  const isLoading = listResult.query?.isLoading;

  const rawLogs = useMemo(() => {
    // In Refine, queryResult.data is the GetListResponse which contains { data: T[], total: number }
    return queryResult?.data || [];
  }, [queryResult]);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Apply local filtering
  const logs = useMemo(() => {
    let filtered = rawLogs;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((log: any) => 
        log.employee?.fullName?.toLowerCase().includes(lower) || 
        log.employee?.employeeNumber?.toLowerCase().includes(lower)
      );
    }
    if (dateFilter) {
      filtered = filtered.filter((log: any) => {
        if (!log.attendanceDate) return false;
        const dateStr = typeof log.attendanceDate === 'string' ? log.attendanceDate : new Date(log.attendanceDate).toISOString();
        return dateStr.startsWith(dateFilter);
      });
    }
    return filtered;
  }, [rawLogs, searchTerm, dateFilter]);

  // Simple stats calculation
  const totalEmployees = new Set(rawLogs.map((l: any) => l.employeeId)).size;
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLogs = rawLogs.filter((l: any) => {
    if (!l.attendanceDate) return false;
    const dateStr = typeof l.attendanceDate === 'string' ? l.attendanceDate : new Date(l.attendanceDate).toISOString();
    return dateStr.startsWith(todayStr);
  });
  
  const totalPresentToday = todayLogs.length;
  const lateComersToday = todayLogs.filter((l: any) => isLate(l)).length;

  const handleExport = () => {
    if (logs.length === 0) return;
    
    const headers = ['Employee', 'Employee ID', 'Date', 'Check In', 'Check Out', 'Status', 'Working Hours', 'Is Late'];
    const csvContent = [
      headers.join(','),
      ...logs.map((log: any) => {
        const empName = `"${log.employee?.fullName || 'Unknown'}"`;
        const empId = `"${log.employee?.employeeNumber || ''}"`;
        const date = format(new Date(log.attendanceDate), 'yyyy-MM-dd');
        const checkIn = log.checkIn ? format(new Date(log.checkIn), 'HH:mm:ss') : '';
        const checkOut = log.checkOut ? format(new Date(log.checkOut), 'HH:mm:ss') : '';
        const status = log.status;
        const hours = log.workingHours ? Number(log.workingHours).toFixed(2) : '0';
        const late = isLate(log) ? 'Yes' : 'No';
        
        return [empName, empId, date, checkIn, checkOut, status, hours, late].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_logs_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">


      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Monitored</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-500">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Active employees</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-emerald-500/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Present Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{totalPresentToday}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Checked in today</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-amber-500/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Late Comers</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-500">{lateComersToday}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Beyond 15 min grace period</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg">Attendance Logs</CardTitle>
            <CardDescription>Organization-wide logs with filters and sorting.</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              size="sm" 
              className="h-9"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleExport} disabled={logs.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <div className="px-6 pb-4 border-b border-border/50 bg-muted/10">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee..."
                  className="pl-9 h-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="relative w-full sm:w-[200px]">
                <Input
                  type="date"
                  className="h-9 text-sm pr-8 w-full"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                {dateFilter && (
                  <button onClick={() => setDateFilter('')} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground bg-background rounded-full">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Employee</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Check In</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Check Out</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {isLoading ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-12">
                       <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                     </TableCell>
                   </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm italic">
                      No logs found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => {
                    const late = isLate(log);
                    return (
                      <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell>
                          <div className="font-bold text-[#111111] dark:text-white">{log.employee?.fullName || 'Unknown'}</div>
                          <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{log.employee?.employeeNumber}</div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{log.attendanceDate ? format(new Date(log.attendanceDate), 'dd MMM yyyy') : '---'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 dark:text-emerald-500 font-mono text-xs font-bold">
                              {log.checkIn ? format(new Date(log.checkIn), 'HH:mm:ss') : '--:--:--'}
                            </span>
                            {late && (
                              <span className="text-[9px] font-black text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900 uppercase tracking-widest">
                                Late
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-blue-600 dark:text-blue-500 font-mono text-xs font-bold">
                          {log.checkOut ? format(new Date(log.checkOut), 'HH:mm:ss') : '--:--:--'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest ${
                            log.status === 'PRESENT' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900' 
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
                          }`}>
                            {log.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-black text-xs">
                          {log.workingHours ? `${Number(log.workingHours).toFixed(2)}h` : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
