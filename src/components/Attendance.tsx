import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Attendance, Class } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../firebase';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AttendancePage({ profile }: { profile: UserProfile }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Students
    const qStudents = query(collection(db, 'users'), where('schoolId', '==', profile.schoolId), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
    });

    // Fetch Attendance for selected date
    const qAttendance = query(
      collection(db, 'attendance'), 
      where('schoolId', '==', profile.schoolId),
      where('date', '==', selectedDate)
    );
    const unsubAttendance = onSnapshot(qAttendance, (snap) => {
      setAttendance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
      setLoading(false);
    });

    return () => { unsubStudents(); unsubAttendance(); };
  }, [profile.schoolId, selectedDate]);

  const toggleAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (profile.role !== 'teacher' && profile.role !== 'admin') return;

    const existing = attendance.find(a => a.studentId === studentId);

    try {
      if (existing) {
        await updateDoc(doc(db, 'attendance', existing.id!), { status });
      } else {
        await addDoc(collection(db, 'attendance'), {
          studentId,
          date: selectedDate,
          status,
          schoolId: profile.schoolId
        });
      }
      toast.success("Davamiyyət yeniləndi");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'attendance');
    }
  };

  if (loading) return <div className="p-8 text-center">Yüklənir...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Davamiyyət</h1>
          <p className="text-muted-foreground">Gündəlik davamiyyət uçotu</p>
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="date">Tarix:</Label>
          <Input 
            id="date" 
            type="date" 
            className="w-[200px]" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
          />
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Şagird A.S.A.</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Əməliyyat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map(student => {
              const record = attendance.find(a => a.studentId === student.id);
              return (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-center">
                    {record ? (
                      <div className="flex justify-center">
                        {record.status === 'present' && <CheckCircle2 className="text-green-500 h-6 w-6" />}
                        {record.status === 'absent' && <XCircle className="text-red-500 h-6 w-6" />}
                        {record.status === 'late' && <Clock className="text-orange-500 h-6 w-6" />}
                      </div>
                    ) : <span className="text-muted-foreground text-xs italic">Qeyd yoxdur</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant={record?.status === 'present' ? 'default' : 'outline'}
                        onClick={() => toggleAttendance(student.id, 'present')}
                      >
                        İştirak
                      </Button>
                      <Button 
                        size="sm" 
                        variant={record?.status === 'absent' ? 'destructive' : 'outline'}
                        onClick={() => toggleAttendance(student.id, 'absent')}
                      >
                        Qayıb
                      </Button>
                      <Button 
                        size="sm" 
                        variant={record?.status === 'late' ? 'secondary' : 'outline'}
                        onClick={() => toggleAttendance(student.id, 'late')}
                      >
                        Gecikmə
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
