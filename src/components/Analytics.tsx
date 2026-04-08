import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Grade } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, Users, BookOpen, Award } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Analytics({ profile }: { profile: UserProfile }) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qGrades = query(collection(db, 'grades'), where('schoolId', '==', profile.schoolId));
    const unsubGrades = onSnapshot(qGrades, (snap) => {
      setGrades(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade)));
      setLoading(false);
    });

    const qStudents = query(collection(db, 'users'), where('role', '==', 'student'), where('schoolId', '==', profile.schoolId));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudentsCount(snap.size);
    });

    const qSubjects = query(collection(db, 'subjects'), where('schoolId', '==', profile.schoolId));
    const unsubSubjects = onSnapshot(qSubjects, (snap) => {
      setSubjectsCount(snap.size);
    });

    return () => { unsubGrades(); unsubStudents(); unsubSubjects(); };
  }, [profile.schoolId]);

  const getNumericValue = (val: string | number) => {
    if (typeof val === 'number') return val;
    const match = val.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const gradeDistribution = [
    { name: '5', count: grades.filter(g => getNumericValue(g.value) === 5).length, color: '#10b981' },
    { name: '4', count: grades.filter(g => getNumericValue(g.value) === 4).length, color: '#3b82f6' },
    { name: '3', count: grades.filter(g => getNumericValue(g.value) === 3).length, color: '#f59e0b' },
    { name: '2', count: grades.filter(g => getNumericValue(g.value) === 2).length, color: '#ef4444' },
  ];

  const averageScore = grades.length > 0 
    ? (grades.reduce((acc, g) => acc + getNumericValue(g.value), 0) / grades.length).toFixed(2)
    : '0.00';

  const excellentStudents = 0; 

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={TrendingUp} label="Orta bal" value={averageScore} color="text-blue-600" />
        <StatsCard icon={Award} label="Əlaçılar" value={excellentStudents.toString()} color="text-green-600" />
        <StatsCard icon={Users} label="Şagirdlər" value={studentsCount.toString()} color="text-purple-600" />
        <StatsCard icon={BookOpen} label="Fənlər" value={subjectsCount.toString()} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Qiymət paylanması</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {grades.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic">Məlumat yoxdur</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Uğur dinamikası</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <div className="h-full flex items-center justify-center text-muted-foreground italic">Trend analizi üçün kifayət qədər məlumat yoxdur</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const StatsCard = ({ icon: Icon, label, value, color }: any) => (
  <Card className="shadow-sm border-none bg-card">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={cn("p-3 rounded-xl bg-muted/50", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);
