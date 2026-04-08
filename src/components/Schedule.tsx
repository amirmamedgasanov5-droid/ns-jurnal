import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Class, Subject } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../firebase';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface ScheduleEntry {
  id?: string;
  classId: string;
  subjectId: string;
  dayOfWeek: number; // 1-5 (Mon-Fri)
  startTime: string;
  endTime: string;
  schoolId: string;
}

export default function SchedulePage({ profile }: { profile: UserProfile }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Entry State
  const [newDay, setNewDay] = useState('1');
  const [newSubject, setNewSubject] = useState('');
  const [newStart, setNewStart] = useState('08:00');
  const [newEnd, setNewEnd] = useState('08:45');

  const days = [
    { id: 1, name: 'Bazar ertəsi' },
    { id: 2, name: 'Çərşənbə axşamı' },
    { id: 3, name: 'Çərşənbə' },
    { id: 4, name: 'Cümə axşamı' },
    { id: 5, name: 'Cümə' },
  ];

  useEffect(() => {
    const qSubjects = query(collection(db, 'subjects'), where('schoolId', '==', profile.schoolId));
    onSnapshot(qSubjects, (snap) => {
      setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
    });

    const qSchedule = query(collection(db, 'schedule'), where('schoolId', '==', profile.schoolId));
    const unsub = onSnapshot(qSchedule, (snap) => {
      setSchedule(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleEntry)));
      setLoading(false);
    });
    return () => unsub();
  }, [profile.schoolId]);

  const addEntry = async () => {
    if (!newSubject) return;
    try {
      await addDoc(collection(db, 'schedule'), {
        subjectId: newSubject,
        dayOfWeek: parseInt(newDay),
        startTime: newStart,
        endTime: newEnd,
        schoolId: profile.schoolId,
        teacherId: profile.id
      });
      toast.success("Dərs cədvələ əlavə edildi");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'schedule');
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schedule', id));
      toast.success("Dərs silindi");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'schedule');
    }
  };

  if (loading) return <div className="p-8 text-center">Yüklənir...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dərs Cədvəli</h1>
          <p className="text-muted-foreground">Məktəbin ümumi dərs cədvəli</p>
        </div>
        {(profile.role === 'teacher' || profile.role === 'admin') && (
          <Dialog>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Dərs əlavə et</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cədvələ yeni dərs</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Gün</Label>
                  <Select value={newDay} onValueChange={setNewDay}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {days.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fənn</Label>
                  <Select value={newSubject} onValueChange={setNewSubject}>
                    <SelectTrigger><SelectValue placeholder="Fənn seçin" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Başlama</Label>
                    <Input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bitmə</Label>
                    <Input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
                  </div>
                </div>
                <Button onClick={addEntry} className="w-full">Yadda saxla</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {days.map(day => (
          <Card key={day.id} className="shadow-sm border-none bg-muted/20">
            <CardHeader className="bg-muted/50 p-4">
              <CardTitle className="text-sm font-bold text-center">{day.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              {schedule
                .filter(s => s.dayOfWeek === day.id)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(entry => (
                  <div key={entry.id} className="p-3 rounded-md bg-card border shadow-sm relative group">
                    <div className="text-xs font-bold text-primary">{entry.startTime} - {entry.endTime}</div>
                    <div className="text-sm font-medium">{subjects.find(s => s.id === entry.subjectId)?.name}</div>
                    {(profile.role === 'teacher' || profile.role === 'admin') && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => deleteEntry(entry.id!)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              {schedule.filter(s => s.dayOfWeek === day.id).length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground italic">Dərs yoxdur</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
