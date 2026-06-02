'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, LogIn, LogOut, Coffee, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { checkIn, checkOut, getMyAttendance } from '@/lib/hr';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AttendanceWidget: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [myAttendance, setMyAttendance] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await getMyAttendance();
      setMyAttendance(res.data || res);
    } catch (error) {
      console.error(error);
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
      toast.success('Checked in successfully!');
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
  const activeShift = myAttendance?.activeShift?.shiftType;

  return (
    <Card className="h-full border-border/50 shadow-sm">
      <CardHeader className="pb-2 bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Attendance
          </CardTitle>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-background border border-border shadow-sm tracking-tight text-muted-foreground uppercase">
            {format(new Date(), 'dd MMM yyyy')}
          </span>
        </div>
        <CardDescription className="text-xs flex items-center justify-between">
          <span>Log your working hours for today.</span>
          {activeShift && (
            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
              Shift: {activeShift.startTime} - {activeShift.endTime}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6 space-y-5">
        {isLoading ? (
          <div className="animate-pulse flex flex-col items-center gap-3 py-4">
            <div className="h-12 w-12 bg-muted rounded-full"></div>
            <div className="h-4 w-24 bg-muted rounded"></div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              {!hasSessionsToday ? (
                <div className="text-muted-foreground flex flex-col items-center gap-1 opacity-70">
                  <Calendar className="h-10 w-10" />
                  <p className="text-sm font-medium">Ready to start your day?</p>
                </div>
              ) : isCheckedIn ? (
                <div className="text-emerald-500 flex flex-col items-center gap-1">
                  <CheckCircle2 className="h-10 w-10 animate-in zoom-in duration-300" />
                  <p className="font-semibold text-foreground">You are Checked In</p>
                  <p className="text-xs text-muted-foreground">
                    Since {format(new Date(currentSessionStart), 'h:mm a')}
                  </p>
                </div>
              ) : (
                <div className="text-blue-500 flex flex-col items-center gap-1">
                  <Coffee className="h-10 w-10" />
                  <p className="font-semibold text-foreground">Logged Out</p>
                  <p className="text-xs text-muted-foreground">
                    Total today: {Number(totalWorkingHours).toFixed(1)} hours
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full">
              {!isCheckedIn ? (
                <Button
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isActionLoading}
                  onClick={handleCheckIn}
                >
                  <LogIn className="mr-2 h-4 w-4" /> Check In
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  disabled={isActionLoading}
                  onClick={handleCheckOut}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Check Out
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
