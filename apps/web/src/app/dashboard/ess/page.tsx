'use client';

import { 
  Clock, 
  Calendar, 
  Briefcase, 
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Info,
  FileText,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyAttendance, getMyLeaveBalances, getMyPayslips, getMyProfile, checkIn, checkOut, getMyLeaves } from '@/lib/ess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Profile {
  fullName: string;
  employeeNumber: string;
  designation?: { title: string };
  department?: { name: string };
  reportingTo?: { fullName: string };
  dateOfJoining?: string;
  shiftAssignments?: Array<{ shiftType: { name: string } }>;
  email?: string;
  avatarUrl?: string;
}

interface AttendanceStatus {
  isCheckedIn: boolean;
  currentSessionStart: string | null;
  totalWorkingHours: number;
  sessions: any[];
}

interface LeaveBalance {
  leaveType: string;
  balance: number;
}

interface Payslip {
  id: string;
  netSalary: number;
  payrollRun: {
    periodStart: string;
  };
}

interface LeaveApp {
  id: string;
  status: string;
  leaveType: { name: string };
  createdAt: string;
}

interface Notification {
  title: string;
  desc: string;
  time: string;
  icon: any;
  color: string;
}

export default function EssDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [latestPayslip, setLatestPayslip] = useState<Payslip | null>(null);
  const [latestLeave, setLatestLeave] = useState<LeaveApp | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [attData, balData, payslips, profileData, leavesData] = await Promise.all([
          getMyAttendance(),
          getMyLeaveBalances(),
          getMyPayslips(),
          getMyProfile(),
          getMyLeaves()
        ]);
        setAttendance(attData);
        setBalances(balData || []);
        if (payslips && payslips.length > 0) setLatestPayslip(payslips[0]);
        setProfile(profileData);
        if (leavesData && leavesData.length > 0) setLatestLeave(leavesData[0]);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleCheckInOut = async () => {
    try {
      const res = attendance?.isCheckedIn ? await checkOut() : await checkIn();
      if (res) {
        toast.success(`Successfully checked ${attendance?.isCheckedIn ? 'out' : 'in'}`);
        const data = await getMyAttendance();
        setAttendance(data);
      }
    } catch (error) {
      toast.error('An error occurred during check-in/out');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Generate dynamic notifications
  const getDynamicNotifications = (): Notification[] => {
    const notifs: Notification[] = [];
    
    if (attendance?.isCheckedIn) {
      notifs.push({
        title: 'Active Session',
        desc: `You checked in at ${new Date(attendance.currentSessionStart!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        time: 'Just now',
        icon: CheckCircle2,
        color: 'text-emerald-500'
      });
    }

    if (latestLeave) {
      const statusColors: Record<string, string> = {
        PENDING: 'text-amber-500',
        APPROVED: 'text-emerald-500',
        REJECTED: 'text-rose-500',
        CANCELLED: 'text-gray-500'
      };
      notifs.push({
        title: `Leave ${latestLeave.status}`,
        desc: `Your ${latestLeave.leaveType.name} request is ${latestLeave.status.toLowerCase()}`,
        time: new Date(latestLeave.createdAt).toLocaleDateString(),
        icon: latestLeave.status === 'APPROVED' ? CheckCircle2 : latestLeave.status === 'REJECTED' ? AlertCircle : Info,
        color: statusColors[latestLeave.status] || 'text-blue-500'
      });
    }

    if (latestPayslip) {
      notifs.push({
        title: 'Payslip Generated',
        desc: `Payslip for ${new Date(latestPayslip.payrollRun.periodStart).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} is available`,
        time: 'Recent',
        icon: FileText,
        color: 'text-violet-500'
      });
    }

    if (notifs.length === 0) {
      notifs.push({
        title: 'Welcome to ESS',
        desc: 'Keep track of your attendance, leaves, and payslips here.',
        time: 'System',
        icon: Info,
        color: 'text-blue-500'
      });
    }

    return notifs;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded mb-8" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const notifications = getDynamicNotifications();

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#f4f4f5]">Welcome, {profile?.fullName || user?.username || 'Employee'}</h1>
          <div className="text-sm text-[#626260] dark:text-[#a1a1aa] mt-1 flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none uppercase text-[9px]">Active</Badge>
            <span>{profile?.designation?.title || 'Employee'} • {profile?.department?.name || 'Department'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <Link href="/dashboard/ess/attendance">
             <Button variant="outline" size="sm" className="border-[#d3cec6] text-xs h-9">
               View Timesheet
             </Button>
           </Link>
           <Link href="/dashboard/ess/profile">
             <Button variant="outline" size="sm" className="border-[#d3cec6] text-xs h-9">
               Edit Profile
             </Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Card */}
        <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none bg-white dark:bg-[#121214]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#7b7b78] flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              Attendance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-2 space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold tracking-tight">{attendance?.totalWorkingHours?.toFixed(1) || '0.0'}h</p>
                <p className="text-[10px] font-bold uppercase text-[#7b7b78] mt-1 tracking-wider">Logged Today</p>
              </div>
              <Button 
                onClick={handleCheckInOut}
                variant={attendance?.isCheckedIn ? "destructive" : "default"}
                className={`w-full font-bold shadow-sm ${attendance?.isCheckedIn ? '' : 'bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]'}`}
              >
                {attendance?.isCheckedIn ? "Check Out" : "Check In"}
              </Button>
              {attendance?.isCheckedIn && attendance.currentSessionStart && (
                <div className="flex items-center gap-1.5 animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">
                    Session started: {new Date(attendance.currentSessionStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leaves Card */}
        <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none bg-white dark:bg-[#121214]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#7b7b78] flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-emerald-500" />
              Available Leaves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 py-2">
              {balances.length > 0 ? (
                balances.slice(0, 2).map((bal, i) => (
                  <div key={i} className="flex justify-between items-center bg-[#f5f1ec]/50 dark:bg-[#09090b]/50 p-2.5 rounded-lg border border-[#d3cec6]/50">
                    <span className="text-xs font-medium">{bal.leaveType}</span>
                    <span className="font-bold text-sm">{bal.balance} Days</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#626260] italic">No leave balance data</div>
              )}
              <Link href="/dashboard/ess/leaves">
                <Button variant="outline" size="sm" className="w-full mt-1 group text-xs border-[#d3cec6]">
                  Leave Portal <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Payslip Card */}
        <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none bg-white dark:bg-[#121214]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#7b7b78] flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-violet-500" />
              Recent Salary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-2">
              {latestPayslip ? (
                <div className="bg-gradient-to-br from-violet-500/5 to-blue-500/5 p-4 rounded-xl border border-violet-500/20">
                  <p className="text-[10px] font-bold uppercase text-[#7b7b78]">{new Date(latestPayslip.payrollRun.periodStart).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                  <p className="text-xl font-bold tracking-tight mt-1">{formatCurrency(Number(latestPayslip.netSalary))}</p>
                  <Badge variant="outline" className="mt-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-bold uppercase">Paid</Badge>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#626260] italic border-2 border-dashed rounded-xl">No payslips generated yet</div>
              )}
              <Link href="/dashboard/ess/payslips">
                <Button variant="outline" size="sm" className="w-full group text-xs border-[#d3cec6]">
                  View All Payslips <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quick Profile */}
        <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none bg-white dark:bg-[#121214]">
          <CardHeader className="border-b border-[#f5f1ec] dark:border-[#27272a]">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78]">Employment Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-5 mb-8">
              <div className="h-16 w-16 rounded-2xl bg-white dark:bg-[#e2e2e2] border border-[#d3cec6] dark:border-[#27272a] overflow-hidden flex items-center justify-center">
                <img 
                  src={user?.image || profile?.avatarUrl || `https://api.dicebear.com/7.x/lorelei/svg?seed=${user?.username || 'user'}`} 
                  alt={profile?.fullName || ''} 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div>
                <p className="font-bold text-lg">{profile?.fullName}</p>
                <p className="text-sm text-[#626260] dark:text-[#a1a1aa] font-medium">{profile?.designation?.title || 'Employee'}</p>
                <p className="text-[10px] font-bold uppercase text-[#7b7b78] mt-1 tracking-wider">{profile?.department?.name || 'Department'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#f5f1ec]/30 dark:bg-[#09090b]/30 rounded-lg border border-[#d3cec6]/50">
                <span className="text-[10px] font-bold uppercase text-[#7b7b78] block mb-1">Employee ID</span>
                <span className="text-sm font-bold">{profile?.employeeNumber}</span>
              </div>
              <div className="p-3 bg-[#f5f1ec]/30 dark:bg-[#09090b]/30 rounded-lg border border-[#d3cec6]/50">
                <span className="text-[10px] font-bold uppercase text-[#7b7b78] block mb-1">Reporting To</span>
                <span className="text-sm font-bold text-blue-600">{profile?.reportingTo?.fullName || 'HR Manager'}</span>
              </div>
              <div className="p-3 bg-[#f5f1ec]/30 dark:bg-[#09090b]/30 rounded-lg border border-[#d3cec6]/50">
                <span className="text-[10px] font-bold uppercase text-[#7b7b78] block mb-1">Joining Date</span>
                <span className="text-sm font-bold">{profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '---'}</span>
              </div>
              <div className="p-3 bg-[#f5f1ec]/30 dark:bg-[#09090b]/30 rounded-lg border border-[#d3cec6]/50">
                <span className="text-[10px] font-bold uppercase text-[#7b7b78] block mb-1">Work Shift</span>
                <span className="text-sm font-bold">{profile?.shiftAssignments?.[0]?.shiftType?.name || 'Standard 9-6'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications / Updates */}
        <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none bg-white dark:bg-[#121214]">
          <CardHeader className="border-b border-[#f5f1ec] dark:border-[#27272a]">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78] flex items-center justify-between">
              Recent Updates
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {notifications.map((item, i) => (
                <div key={i} className="flex gap-4 group cursor-default">
                  <div className={`mt-0.5 h-8 w-8 rounded-lg ${item.color.replace('text-', 'bg-')}/10 flex items-center justify-center shrink-0`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-[#111111] dark:text-[#f4f4f5]">{item.title}</p>
                      <span className="text-[10px] text-[#7b7b78] font-medium">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-[#626260] dark:text-[#a1a1aa] mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
