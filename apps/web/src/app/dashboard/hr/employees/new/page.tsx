'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { getDepartments, getDesignations, createEmployee } from '@/lib/hr';
import { Loader2, ArrowLeft, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function AddEmployeePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    gender: '',
    departmentId: '',
    designationId: '',
    baseSalary: '',
    dateOfBirth: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    Promise.all([getDepartments(), getDesignations()])
      .then(([depsRes, desigsRes]) => {
        if (depsRes.success) setDepartments(depsRes.data);
        if (desigsRes.success) setDesignations(desigsRes.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const res = await createEmployee(formData);
      if (res.success) {
        router.push('/dashboard/hr/employees');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/hr/employees">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Onboard Employee</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Add a new employee to the company directory.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            {/* Personal Details */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-5 py-3.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Personal Details</h2>
              </div>
              <div className="p-5 grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="john.doe@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNo">Mobile Number</Label>
                  <Input id="mobileNo" name="mobileNo" value={formData.mobileNo} onChange={handleChange} placeholder="+1 234 567 8900" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="" className="bg-background">Select Gender</option>
                    <option value="Male" className="bg-background">Male</option>
                    <option value="Female" className="bg-background">Female</option>
                    <option value="Other" className="bg-background">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-5 py-3.5">
                <h2 className="text-sm font-semibold">Employment Information</h2>
              </div>
              <div className="p-5 grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.departmentId}
                    onChange={handleChange}
                  >
                    <option value="" className="bg-background">No Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id} className="bg-background">{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designationId">Designation / Title</Label>
                  <select
                    id="designationId"
                    name="designationId"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.designationId}
                    onChange={handleChange}
                  >
                    <option value="" className="bg-background">No Designation</option>
                    {designations.map(d => (
                      <option key={d.id} value={d.id} className="bg-background">{d.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseSalary">Base Salary</Label>
                  <Input id="baseSalary" name="baseSalary" type="number" min="0" step="0.01" value={formData.baseSalary} onChange={handleChange} placeholder="0.00" />
                  <p className="text-[10px] text-muted-foreground">Monthly gross salary used for payroll calculation.</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                  <Input id="dateOfJoining" name="dateOfJoining" type="date" required value={formData.dateOfJoining} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Link href="/dashboard/hr/employees">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Employee
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
