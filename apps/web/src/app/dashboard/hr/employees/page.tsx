'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getEmployees } from '@/lib/hr';
import { Loader2, Plus, Search, MoreHorizontal, User, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export default function EmployeesDirectoryPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getEmployees()
      .then((res) => {
        if (res.success) {
          setEmployees(res.data);
        } else {
          setError(res.error || 'Failed to load employees');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load employees');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredEmployees = employees.filter(e => 
    (e.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.employeeNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Employee Directory</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage your workforce and view employee profiles.
            </p>
          </div>
          <Link href="/dashboard/hr/employees/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-none bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <MoreHorizontal className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg text-destructive">{error}</h3>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">No employees found</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                Get started by onboarding your first employee into the system.
              </p>
              <Link href="/dashboard/hr/employees/new" className="mt-4">
                <Button variant="outline">Onboard Employee</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Employee</th>
                    <th className="px-6 py-4 font-medium">Emp No</th>
                    <th className="px-6 py-4 font-medium">Department</th>
                    <th className="px-6 py-4 font-medium">Designation</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                            {employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}
                          </div>
                          <div>
                            <p className="font-medium">{employee.fullName}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{employee.employeeNumber}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {employee.department?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {employee.designation?.title || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-none border-0">
                          {employee.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/hr/employees/${employee.id}`} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" /> View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/hr/employees/${employee.id}/edit`} className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" /> Edit Employee
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 cursor-pointer">
                              <Trash2 className="h-4 w-4 mr-2" /> Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEmployees.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No employees match your search query.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
