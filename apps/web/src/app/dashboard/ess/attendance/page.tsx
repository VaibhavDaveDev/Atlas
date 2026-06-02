'use client';

import { useEffect, useState, useMemo } from 'react';
import { Clock, Search, Calendar as CalendarIcon } from 'lucide-react';
import { getMyAttendanceHistory } from '@/lib/ess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AttendanceRecord {
  id: string;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number | null;
  status: string;
  remarks: string | null;
}

export default function EssAttendancePage() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const data = await getMyAttendanceHistory(month, year);
        setHistory(data || []);
      } catch (error) {
        console.error('Failed to fetch attendance history', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [month, year]);

  const filteredHistory = useMemo(() => {
    return history.filter(record => 
      new Date(record.attendanceDate).toLocaleDateString('en-IN').includes(searchTerm) ||
      record.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none">Present</Badge>;
      case 'ABSENT':
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-none">Absent</Badge>;
      case 'HALF_DAY':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none">Half Day</Badge>;
      case 'ON_LEAVE':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-none">On Leave</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5] flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-500" /> My Attendance History
          </h1>
          <p className="text-sm text-[#626260] dark:text-[#a1a1aa] mt-1">
            Review your daily check-ins, check-outs, and total working hours.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] rounded-md px-3 h-9">
            <CalendarIcon className="h-4 w-4 text-[#7b7b78] mr-2" />
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-transparent text-sm focus:outline-none pr-2 dark:text-[#f4f4f5]"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m} className="dark:bg-[#121214] dark:text-[#f4f4f5]">
                  {new Date(0, m - 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <span className="text-[#d3cec6] mx-1">|</span>
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent text-sm focus:outline-none pl-1 dark:text-[#f4f4f5]"
            >
              {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map(y => (
                <option key={y} value={y} className="dark:bg-[#121214] dark:text-[#f4f4f5]">{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none overflow-hidden">
        <CardHeader className="bg-[#f5f1ec]/50 dark:bg-[#09090b]/50 border-b border-[#d3cec6] dark:border-[#27272a] px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78]">Attendance Logs</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7b7b78]" />
              <Input
                placeholder="Search by date (DD/MM/YYYY) or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white dark:bg-[#121214] border-[#d3cec6] dark:border-[#27272a] h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px] md:min-w-full">
            <TableHeader className="bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
              <TableRow className="border-[#d3cec6] dark:border-[#27272a] hover:bg-transparent">
                <TableHead className="w-[180px] font-bold text-[#111111] dark:text-[#f4f4f5] py-4">Date</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Check In</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Check Out</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Working Hours</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Status</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-[#d3cec6] dark:border-[#27272a]">
                    <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/20" />
                  </TableRow>
                ))
              ) : filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#626260] dark:text-[#a1a1aa]">
                    No attendance records found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((record) => (
                  <TableRow key={record.id} className="border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec]/50 dark:hover:bg-[#121214]/50 transition-colors">
                    <TableCell className="font-medium py-4">{formatDate(record.attendanceDate)}</TableCell>
                    <TableCell className="text-[#111111] dark:text-[#f4f4f5]">{formatTime(record.checkIn)}</TableCell>
                    <TableCell className="text-[#111111] dark:text-[#f4f4f5]">{formatTime(record.checkOut)}</TableCell>
                    <TableCell className="font-semibold text-blue-600 dark:text-blue-400">
                      {record.workingHours ? `${Number(record.workingHours).toFixed(2)}h` : '--'}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-xs text-[#626260] dark:text-[#a1a1aa] italic max-w-xs truncate">
                      {record.remarks || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
