import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { UserProfile, Lesson, Grade, Subject, Class } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Plus, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Journal({ profile }: { profile: UserProfile }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Grade Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<UserProfile | null>(null);
  const [targetSubject, setTargetSubject] = useState<Subject | null>(null);
  const [newGradeValue, setNewGradeValue] = useState('');

  useEffect(() => {
    // Fetch Subjects
    const qSubjects = query(collection(db, 'subjects'), where('schoolId', '==', profile.schoolId));
    const unsubSubjects = onSnapshot(qSubjects, (snap) => {
      setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
    });

    // Fetch Students
    const qStudents = query(collection(db, 'users'), where('schoolId', '==', profile.schoolId), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
    });

    // Fetch Grades
    const qGrades = query(collection(db, 'grades'), where('schoolId', '==', profile.schoolId));
    const unsubGrades = onSnapshot(qGrades, (snap) => {
      setGrades(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade)));
      setLoading(false);
    });

    return () => { unsubSubjects(); unsubStudents(); unsubGrades(); };
  }, [profile.schoolId]);

  const addGrade = async () => {
    if (!targetStudent || !targetSubject || !newGradeValue) return;
    try {
      await addDoc(collection(db, 'grades'), {
        studentId: targetStudent.id,
        subjectId: targetSubject.id,
        value: newGradeValue,
        weight: 1,
        createdAt: new Date().toISOString(),
        schoolId: profile.schoolId
      });
      toast.success("Qiymət əlavə edildi");
      setIsDialogOpen(false);
      setNewGradeValue('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'grades');
    }
  };

  const getStudentGradesForSubject = (studentId: string, subjectId: string) => {
    return grades
      .filter(g => g.studentId === studentId && g.subjectId === subjectId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  if (loading) return <div className="p-8 text-center">Yüklənir...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Elektron Jurnal</h1>
          <p className="text-muted-foreground">Bütün fənlər üzrə qiymətlər</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Calculator className="mr-2 h-4 w-4" />
          Çap et
        </Button>
      </div>

      <Card className="overflow-hidden border-none shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px] sticky left-0 bg-muted/50 z-20 font-bold border-r">Şagird A.S.A.</TableHead>
                {subjects.map(subject => (
                  <TableHead key={subject.id} className="text-center min-w-[150px] font-bold border-r">
                    {subject.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(student => (
                <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-semibold sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {student.name}
                  </TableCell>
                  {subjects.map(subject => {
                    const studentGrades = getStudentGradesForSubject(student.id, subject.id);
                    return (
                      <TableCell 
                        key={subject.id} 
                        className="text-center border-r p-2 cursor-pointer hover:bg-primary/5 transition-colors min-h-[60px]"
                        onClick={() => {
                          if (profile.role === 'teacher' || profile.role === 'admin') {
                            setTargetStudent(student);
                            setTargetSubject(subject);
                            setIsDialogOpen(true);
                          }
                        }}
                      >
                        <div className="flex flex-wrap justify-center gap-1">
                          {studentGrades.length > 0 ? (
                            studentGrades.map((g, i) => (
                              <span 
                                key={i} 
                                className={cn(
                                  "inline-flex items-center justify-center px-2 py-1 rounded text-sm font-bold",
                                  g.value.includes('5') ? "text-green-700 bg-green-100" : 
                                  g.value.includes('4') ? "text-blue-700 bg-blue-100" :
                                  g.value.includes('3') ? "text-orange-700 bg-orange-100" : "text-red-700 bg-red-100"
                                )}
                              >
                                {g.value}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground/30 text-xs italic">Qiymət yoxdur</span>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Qiymət yaz</DialogTitle>
            <DialogDescription>
              {targetStudent?.name} - {targetSubject?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="grade">Qiymət (məsələn: 5, 5+, 4-)</Label>
              <div className="flex flex-wrap gap-2">
                {['5+', '5', '5-', '4+', '4', '4-', '3+', '3', '3-', '2'].map(val => (
                  <Button 
                    key={val} 
                    variant={newGradeValue === val ? 'default' : 'outline'}
                    size="sm"
                    className="w-12 h-10 font-bold"
                    onClick={() => setNewGradeValue(val)}
                  >
                    {val}
                  </Button>
                ))}
              </div>
              <Input 
                id="grade" 
                placeholder="Və ya özünüz yazın..." 
                value={newGradeValue} 
                onChange={(e) => setNewGradeValue(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Ləğv et</Button>
            <Button onClick={addGrade}>Yadda saxla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
