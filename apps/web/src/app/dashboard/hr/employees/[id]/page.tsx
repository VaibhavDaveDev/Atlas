'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Building2, Briefcase, Mail, Phone, Calendar, ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmployeeById } from '@/lib/hr';
import { format } from 'date-fns';
import Link from 'next/link';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await getEmployeeById(params.id as string);
        setEmployee(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchEmployee();
  }, [params.id]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-6 max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </AppShell>
    );
  }

  if (!employee) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Employee not found.</p>
          <Button variant="link" onClick={() => router.back()}>Go Back</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/hr/employees">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{employee.fullName}</h1>
            <p className="text-sm text-muted-foreground">Employee #{employee.employeeNumber}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Designation</p>
                  <p className="text-sm font-semibold">{employee.designation?.title || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Department</p>
                  <p className="text-sm font-semibold">{employee.department?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold">{employee.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mobile No.</p>
                  <p className="text-sm font-semibold">{employee.mobileNo || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statutory Details (India)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">PAN</div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">PAN Number</p>
                  <p className="text-sm font-semibold uppercase">{employee.panNumber || 'Not Provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-violet-500/10 flex items-center justify-center text-[10px] font-bold text-violet-500">PF</div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">PF Account No.</p>
                  <p className="text-sm font-semibold uppercase">{employee.pfAccount || 'Not Provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-500">ESI</div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">ESI Number</p>
                  <p className="text-sm font-semibold uppercase">{employee.esiNumber || 'Not Provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-500">ADR</div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Aadhaar Number</p>
                  <p className="text-sm font-semibold uppercase">{employee.aadhaarNumber || 'Not Provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Employment History & Status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date of Joining</p>
                <p className="text-sm font-semibold">
                  {employee.dateOfJoining ? format(new Date(employee.dateOfJoining), 'PPP') : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Status</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-2 w-2 rounded-full ${employee.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <p className="text-sm font-semibold capitalize">{employee.status.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
