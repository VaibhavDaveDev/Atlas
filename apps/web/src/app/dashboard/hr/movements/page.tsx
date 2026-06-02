'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Loader2, ArrowRight, Plus, CheckCircle2, TrendingUp, Clock, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormContainer } from '@/components/common/FormContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getEmployeeMovements, 
  createEmployeeMovement, 
  approveEmployeeMovement, 
  getEmployees, 
  getDepartments, 
  getDesignations 
} from '@/lib/hr';
import { format } from 'date-fns';
import Link from 'next/link';

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProposing, setIsProposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'PROMOTION',
    movementDate: format(new Date(), 'yyyy-MM-dd'),
    toDepartmentId: '',
    toDesignationId: '',
    toSalary: '',
    reason: ''
  });

  const selectedEmployee = employees.find(e => e.id === formData.employeeId);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [movementsRes, employeesRes, deptsRes, desigsRes] = await Promise.all([
        getEmployeeMovements(),
        getEmployees(),
        getDepartments(),
        getDesignations()
      ]);
      
      setMovements(Array.isArray(movementsRes) ? movementsRes : movementsRes.data || []);
      setEmployees(Array.isArray(employeesRes) ? employeesRes : employeesRes.data || []);
      setDepartments(Array.isArray(deptsRes) ? deptsRes : deptsRes.data || []);
      setDesignations(Array.isArray(desigsRes) ? desigsRes : desigsRes.data || []);
    } catch (error) {
      console.error('Failed to load movements data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createEmployeeMovement(formData);
      setIsProposing(false);
      setFormData({
        employeeId: '',
        type: 'PROMOTION',
        movementDate: format(new Date(), 'yyyy-MM-dd'),
        toDepartmentId: '',
        toDesignationId: '',
        toSalary: '',
        reason: ''
      });
      loadData();
    } catch (error) {
      console.error('Failed to propose movement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveEmployeeMovement(id);
      loadData();
    } catch (error) {
      console.error('Failed to approve movement:', error);
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6 text-[#111111] dark:text-[#f4f4f5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Employee Movements</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage promotions, transfers, and annual CTC revisions.</p>
          </div>
          <div className="shrink-0">
            <Button className="bg-[#111111] dark:bg-[#f4f4f5] dark:text-[#111111] shadow-sm" onClick={() => setIsProposing(true)}>
              <Plus className="mr-2 h-4 w-4" /> 
              Propose New Movement
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur-sm border-indigo-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Growth Tracker</CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-500">
                {movements.filter(m => m.type === 'PROMOTION').length} <span className="text-sm font-normal text-muted-foreground">Promotions</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-emerald-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Internal Mobility</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
                {movements.filter(m => m.type === 'TRANSFER').length} <span className="text-sm font-normal text-muted-foreground">Transfers</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="overflow-x-auto pb-2 scrollbar-none">
            <TabsList className="flex w-max sm:grid sm:w-full sm:grid-cols-3 max-w-[500px] bg-muted/50 p-1 rounded-lg min-w-full sm:min-w-0">
              <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-0">All Records</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-md data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-0">Queue ({movements.filter(m => m.status === 'PROPOSED').length})</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-md data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-950/50 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-0">Processed</TabsTrigger>
            </TabsList>
          </div>

          {['all', 'pending', 'completed'].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="mt-4">
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" /></div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground font-black">
                        <TableRow>
                          <TableHead className="px-6 py-4">Employee</TableHead>
                          <TableHead className="px-6 py-4">Type</TableHead>
                          <TableHead className="px-6 py-4">Effective Date</TableHead>
                          <TableHead className="px-6 py-4">Revision Details</TableHead>
                          <TableHead className="px-6 py-4 text-right">Workflow Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-border/50">
                        {movements
                          .filter(m => 
                            tabValue === 'all' ? true :
                            tabValue === 'pending' ? m.status === 'PROPOSED' :
                            m.status === 'APPROVED'
                          )
                          .map((m) => (
                          <TableRow key={m.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="px-6 py-4">
                              <Link href={`/dashboard/hr/employees/${m.employeeId}`} className="font-bold hover:underline text-[#111111] dark:text-white">
                                {m.employee?.fullName}
                              </Link>
                              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{m.employee?.employeeNumber}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <Badge variant="outline" className={
                                m.type === 'PROMOTION' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800' :
                                m.type === 'TRANSFER' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800' :
                                'bg-muted border-border text-muted-foreground'
                              }>
                                {m.type.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-xs font-medium">{format(new Date(m.movementDate), 'dd MMM yyyy')}</TableCell>
                            <TableCell className="px-6 py-4 text-sm">
                              <div className="space-y-2">
                                {m.toDesignation && m.fromDesignationId !== m.toDesignationId && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-[9px] bg-muted/50 px-1.5 py-0.5 rounded font-black uppercase text-muted-foreground w-14 text-center">Title</span>
                                    <span className="text-xs text-muted-foreground/60 line-through truncate max-w-[80px]">{m.fromDesignation?.title || 'None'}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-bold">{m.toDesignation?.title}</span>
                                  </div>
                                )}
                                {m.toDepartment && m.fromDepartmentId !== m.toDepartmentId && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-[9px] bg-muted/50 px-1.5 py-0.5 rounded font-black uppercase text-muted-foreground w-14 text-center">Department</span>
                                    <span className="text-xs text-muted-foreground/60 line-through truncate max-w-[80px]">{m.fromDepartment?.name || 'None'}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-bold">{m.toDepartment?.name}</span>
                                  </div>
                                )}
                                {m.toSalary && m.fromSalary !== m.toSalary && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-[9px] bg-muted/50 px-1.5 py-0.5 rounded font-black uppercase text-muted-foreground w-14 text-center">CTC</span>
                                    <span className="text-xs text-muted-foreground/60 line-through whitespace-nowrap">₹{m.fromSalary?.toLocaleString()}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">₹{m.toSalary?.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              {m.status === 'PROPOSED' ? (
                                <div className="flex flex-col items-end gap-2">
                                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 uppercase tracking-widest flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> Awaiting Approval
                                  </span>
                                  <Button 
                                    size="sm" 
                                    className="h-7 px-3 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                                    onClick={() => handleApprove(m.id)}
                                  >
                                    <CheckCircle2 className="mr-1.5 h-3 w-3" />
                                    Approve & Process
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 text-[10px] font-black">
                                    <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Processed & Live
                                  </Badge>
                                  <span className="text-[9px] text-muted-foreground italic font-medium">Role updated in master</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {movements.filter(m => 
                          tabValue === 'all' ? true :
                          tabValue === 'pending' ? m.status === 'PROPOSED' :
                          m.status === 'APPROVED'
                        ).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="h-8 w-8 text-muted-foreground/30" />
                                <p className="text-sm font-medium">No records found in this queue.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <FormContainer title="Propose Movement" isOpen={isProposing} setIsOpen={setIsProposing}>
          <form onSubmit={handlePropose} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Employee</Label>
              <select 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.employeeId}
                onChange={e => setFormData({...formData, employeeId: e.target.value})}
              >
                <option value="">Choose an employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeNumber})</option>
                ))}
              </select>
            </div>

            {selectedEmployee && (
              <div className="p-4 rounded-lg bg-muted/20 border border-border/50 grid grid-cols-3 gap-4 text-[10px]">
                <div>
                  <p className="text-muted-foreground uppercase font-bold tracking-widest mb-1">Current Department</p>
                  <p className="font-semibold text-sm">{selectedEmployee.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase font-bold tracking-widest mb-1">Current Designation</p>
                  <p className="font-semibold text-sm">{selectedEmployee.designation?.title || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase font-bold tracking-widest mb-1">Current CTC (Annual)</p>
                  <p className="font-semibold text-sm">₹{selectedEmployee.baseSalary?.toLocaleString() || '0'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Movement Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="PROMOTION">Promotion</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="RE_DESIGNATION">Re-designation</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Effective Date</Label>
                <Input 
                  type="date" 
                  required 
                  value={formData.movementDate}
                  onChange={e => setFormData({...formData, movementDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Department</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.toDepartmentId}
                  onChange={e => setFormData({...formData, toDepartmentId: e.target.value})}
                >
                  <option value="">No Change</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Designation</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.toDesignationId}
                  onChange={e => setFormData({...formData, toDesignationId: e.target.value})}
                >
                  <option value="">No Change</option>
                  {designations.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revised Annual CTC (INR)</Label>
              <Input 
                type="number" 
                placeholder="Leave blank for no change"
                value={formData.toSalary}
                onChange={e => setFormData({...formData, toSalary: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason for Movement</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                placeholder="e.g. Completed 1 year; Exceptional performance in recent projects..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsProposing(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#111111] dark:bg-[#f4f4f5] dark:text-[#111111]" disabled={isSubmitting || !formData.employeeId}>
                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
              </Button>
            </div>
          </form>
        </FormContainer>

      </div>
    </AppShell>
  );
}