'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2, XCircle, LogIn, LogOut, Coffee } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { checkIn, checkOut, getMyAttendance, getAttendanceLogs } from '@/lib/hr';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AttendancePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [myAttendance, setMyAttendance] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [myRes, logsRes] = await Promise.all([
        getMyAttendance().catch(() => ({ data: null })),
        getAttendanceLogs().catch(() => ({ data: [] })),
      ]);
      setMyAttendance(myRes.data);
      setLogs(logsRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async () => {
    setIsActionLoading(true);
    try {
      await checkIn();
      toast.success('Checked in successfully! Have a great shift.');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error checking in');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsActionLoading(true);
    try {
      await checkOut();
      toast.success('Checked out successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error checking out');
    } finally {
      setIsActionLoading(false);
    }
  };

  const isCheckedIn = myAttendance?.isCheckedIn;
  const currentSessionStart = myAttendance?.currentSessionStart;
  const totalWorkingHours = myAttendance?.totalWorkingHours || 0;
  const hasSessionsToday = myAttendance?.sessions && myAttendance.sessions.length > 0;

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Attendance
            </h1>
            <p className="text-sm text-muted-foreground">Manage your daily check-ins and view logs.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Status</CardTitle>
              <CardDescription>{format(new Date(), 'EEEE, MMMM do yyyy')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 space-y-6">
              {isLoading ? (
                <div className="animate-pulse flex flex-col items-center gap-4">
                  <div className="h-16 w-16 bg-muted rounded-full"></div>
                  <div className="h-4 w-32 bg-muted rounded"></div>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    {!hasSessionsToday ? (
                      <div className="text-muted-foreground flex flex-col items-center gap-2">
                        <Calendar className="h-12 w-12 opacity-50" />
                        <p>You haven't checked in yet today.</p>
                      </div>
                    ) : isCheckedIn ? (
                      <div className="text-emerald-500 flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-12 w-12" />
                        <p className="font-medium text-foreground">You are currently checked in.</p>
                        <p className="text-sm text-muted-foreground">
                          Active since {format(new Date(currentSessionStart), 'h:mm a')}
                        </p>
                      </div>
                    ) : (
                      <div className="text-blue-500 flex flex-col items-center gap-2">
                        <Coffee className="h-12 w-12" />
                        <p className="font-medium text-foreground">You are currently checked out.</p>
                        <p className="text-sm text-muted-foreground">
                          Total Logged: {Number(totalWorkingHours).toFixed(1)} hours today
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 w-full max-w-sm">
                    <Button
                      size="lg"
                      className="flex-1"
                      disabled={isCheckedIn || isActionLoading}
                      onClick={handleCheckIn}
                    >
                      <LogIn className="mr-2 h-4 w-4" /> Check In
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1"
                      disabled={!isCheckedIn || isActionLoading}
                      onClick={handleCheckOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Check Out
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Logs Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
              <CardDescription>Company-wide attendance history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.length === 0 && !isLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No attendance logs found.</p>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-muted-foreground">
                          <th className="py-2 px-4 text-left font-medium">Employee</th>
                          <th className="py-2 px-4 text-left font-medium">Date</th>
                          <th className="py-2 px-4 text-left font-medium">In/Out</th>
                          <th className="py-2 px-4 text-right font-medium">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.slice(0, 5).map((log) => (
                          <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2 px-4">{log.employee?.fullName || 'Unknown'}</td>
                            <td className="py-2 px-4">{format(new Date(log.attendanceDate), 'MMM d')}</td>
                            <td className="py-2 px-4">
                              <span className="text-emerald-500">
                                {log.checkIn ? format(new Date(log.checkIn), 'HH:mm') : '-'}
                              </span>
                              {' / '}
                              <span className="text-blue-500">
                                {log.checkOut ? format(new Date(log.checkOut), 'HH:mm') : '-'}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-right">
                              {log.workingHours ? Number(log.workingHours).toFixed(1) : '-'}
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
      </div>
    </AppShell>
  );
}
