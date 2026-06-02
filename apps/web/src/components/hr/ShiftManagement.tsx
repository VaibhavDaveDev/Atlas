'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormContainer } from '@/components/common/FormContainer';
import { Loader2, Plus, Users } from 'lucide-react';
import { getShiftTypes, createShiftType, assignShift, getEmployees } from '@/lib/hr';
import { toast } from 'sonner';

export const ShiftManagement: React.FC = () => {
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Single state for active form to prevent leakage
  const [activeForm, setActiveForm] = useState<'CREATE' | 'ASSIGN' | null>(null);

  const [shiftFormData, setShiftFormData] = useState({ name: '', startTime: '09:00', endTime: '18:00', isDefault: false });
  const [assignFormData, setAssignFormData] = useState({ employeeId: '', shiftTypeId: '', fromDate: new Date().toISOString().slice(0, 10), toDate: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [shiftsRes, empsRes] = await Promise.all([
        getShiftTypes(),
        getEmployees()
      ]);
      setShiftTypes(Array.isArray(shiftsRes) ? shiftsRes : shiftsRes.data || []);
      setEmployees(Array.isArray(empsRes) ? empsRes : empsRes.data || []);
    } catch (error) {
      console.error('Failed to load shift data', error);
      toast.error('Failed to load shift data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createShiftType(shiftFormData);
      toast.success('Shift created successfully');
      setActiveForm(null);
      setShiftFormData({ name: '', startTime: '09:00', endTime: '18:00', isDefault: false });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create shift');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await assignShift(assignFormData);
      toast.success('Shift assigned successfully');
      setActiveForm(null);
      setAssignFormData({ employeeId: '', shiftTypeId: '', fromDate: new Date().toISOString().slice(0, 10), toDate: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign shift');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Shift Roster & Rules</h2>
          <p className="text-sm text-muted-foreground">Manage organization shifts and employee assignments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={activeForm === 'ASSIGN' ? "secondary" : "outline"} 
            onClick={() => setActiveForm(activeForm === 'ASSIGN' ? null : 'ASSIGN')}
          >
            <Users className="mr-2 h-4 w-4" /> Assign Shift
          </Button>
          <Button 
            className={activeForm === 'CREATE' ? "bg-muted" : "bg-[#111111] dark:bg-[#f4f4f5] dark:text-[#111111]"} 
            onClick={() => setActiveForm(activeForm === 'CREATE' ? null : 'CREATE')}
          >
            <Plus className="mr-2 h-4 w-4" /> New Shift
          </Button>
        </div>
      </div>

      {/* Form Area - Desktop inline / Mobile dialog */}
      <div>
        <FormContainer 
          title="Create New Shift" 
          isOpen={activeForm === 'CREATE'} 
          setIsOpen={(open) => setActiveForm(open ? 'CREATE' : null)}
        >
          <form onSubmit={handleCreateShift} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shift Name</Label>
              <Input required placeholder="e.g. Night Shift" value={shiftFormData.name} onChange={e => setShiftFormData({...shiftFormData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Time</Label>
                <Input required type="time" value={shiftFormData.startTime} onChange={e => setShiftFormData({...shiftFormData, startTime: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">End Time</Label>
                <Input required type="time" value={shiftFormData.endTime} onChange={e => setShiftFormData({...shiftFormData, endTime: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="isDefault" 
                checked={shiftFormData.isDefault} 
                onChange={e => setShiftFormData({...shiftFormData, isDefault: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
              />
              <Label htmlFor="isDefault" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Make this the default company shift
              </Label>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setActiveForm(null)}>Cancel</Button>
              <Button type="submit" className="bg-[#111111] dark:bg-[#f4f4f5] dark:text-[#111111]" disabled={isSaving}>{isSaving ? 'Saving...' : 'Create Shift'}</Button>
            </div>
          </form>
        </FormContainer>

        <FormContainer 
          title="Assign Shift to Employee" 
          isOpen={activeForm === 'ASSIGN'} 
          setIsOpen={(open) => setActiveForm(open ? 'ASSIGN' : null)}
        >
          <form onSubmit={handleAssignShift} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Employee</Label>
              <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={assignFormData.employeeId} onChange={e => setAssignFormData({...assignFormData, employeeId: e.target.value})}>
                <option value="">Choose an employee...</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Shift</Label>
              <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={assignFormData.shiftTypeId} onChange={e => setAssignFormData({...assignFormData, shiftTypeId: e.target.value})}>
                <option value="">Choose a shift...</option>
                {shiftTypes.map(st => <option key={st.id} value={st.id}>{st.name} ({st.startTime} - {st.endTime})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">From Date</Label>
                <Input required type="date" value={assignFormData.fromDate} onChange={e => setAssignFormData({...assignFormData, fromDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To Date (Optional)</Label>
                <Input type="date" placeholder="Leave blank for permanent" value={assignFormData.toDate} onChange={e => setAssignFormData({...assignFormData, toDate: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setActiveForm(null)}>Cancel</Button>
              <Button type="submit" className="bg-[#111111] dark:bg-[#f4f4f5] dark:text-[#111111]" disabled={isSaving}>{isSaving ? 'Assigning...' : 'Assign Shift'}</Button>
            </div>
          </form>
        </FormContainer>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-xl">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Shift Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Start Time</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">End Time</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Default</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : shiftTypes.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm italic">No shifts configured.</TableCell></TableRow>
                ) : (
                  shiftTypes.map(shift => (
                    <TableRow key={shift.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-bold text-[#111111] dark:text-white">{shift.name}</TableCell>
                      <TableCell className="font-mono text-emerald-600 dark:text-emerald-500 font-bold">{shift.startTime}</TableCell>
                      <TableCell className="font-mono text-blue-600 dark:text-blue-500 font-bold">{shift.endTime}</TableCell>
                      <TableCell className="text-right">
                        {shift.isDefault ? (
                          <span className="px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border-emerald-200">Yes</span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};