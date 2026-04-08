/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, addDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider, OperationType, handleFirestoreError } from './firebase';
import { UserProfile, UserRole, Subject, Class } from './types';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Calendar, 
  BarChart3, 
  LogOut, 
  User as UserIcon,
  GraduationCap,
  ClipboardCheck,
  Settings
} from 'lucide-react';
import { cn } from './lib/utils';

// Components (to be created in separate files or defined here for brevity in this turn)
const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground font-medium">ElJurnal Pro yüklənir...</p>
    </div>
  </div>
);

const LoginPage = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error(error);
      toast.error("Giriş xətası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">ElJurnal Pro</CardTitle>
          <CardDescription>Peşəkar məktəb idarəetmə sistemi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={handleLogin} className="w-full h-12 text-lg" disabled={loading}>
            Google ilə daxil ol
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            Sistemə daxil olmaq üçün Google hesabınızdan istifadə edin
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const CompleteProfile = ({ user, onComplete }: { user: any, onComplete: (profile: UserProfile) => void }) => {
  const [name, setName] = useState(user.displayName || '');
  const [role, setRole] = useState<UserRole>('student');
  const [teacherCode, setTeacherCode] = useState('');
  const [schoolId, setSchoolId] = useState('default-school');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === 'teacher' && teacherCode !== 'Samsung71') {
      toast.error("Müəllim kodu yanlışdır!");
      return;
    }

    setLoading(true);
    const profile: UserProfile = {
      id: user.uid,
      email: user.email,
      name,
      role,
      schoolId,
    };
    try {
      await setDoc(doc(db, 'users', user.uid), profile);
      onComplete(profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Qeydiyyatın tamamlanması</CardTitle>
          <CardDescription>Zəhmət olmasa profil məlumatlarını doldurun</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>A.S.A.</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Şagird</SelectItem>
                  <SelectItem value="teacher">Müəllim</SelectItem>
                  <SelectItem value="parent">Valideyn</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'teacher' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="teacherCode">Müəllim təsdiq kodu</Label>
                <Input 
                  id="teacherCode" 
                  type="password" 
                  placeholder="Kodu daxil edin..." 
                  value={teacherCode} 
                  onChange={e => setTeacherCode(e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Yadda saxlanılır..." : "İşə başla"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const Sidebar = ({ profile }: { profile: UserProfile }) => {
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Panel', path: '/' },
    { icon: BookOpen, label: 'Jurnal', path: '/journal' },
    { icon: ClipboardCheck, label: 'Davamiyyət', path: '/attendance' },
    { icon: Calendar, label: 'Cədvəl', path: '/schedule' },
    { icon: BarChart3, label: 'Analitika', path: '/analytics' },
  ];

  if (profile.role === 'admin' || profile.role === 'teacher') {
    navItems.push({ icon: Settings, label: 'Parametrlər', path: '/settings' });
  }

  return (
    <div className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-6 border-bottom flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-primary" />
        <span className="font-bold text-xl tracking-tight">ElJurnal Pro</span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium",
              location.pathname === item.path 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold truncate">{profile.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{profile.role === 'teacher' ? 'Müəllim' : profile.role === 'student' ? 'Şagird' : profile.role === 'parent' ? 'Valideyn' : 'Admin'}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut(auth)}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Çıxış
        </Button>
      </div>
    </div>
  );
};

import { ErrorBoundary } from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Analytics from './components/Analytics';
import Attendance from './components/Attendance';
import Schedule from './components/Schedule';

// Settings Page for managing Subjects and Classes
const SettingsPage = ({ profile }: { profile: UserProfile }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newClass, setNewClass] = useState('');

  useEffect(() => {
    const qS = query(collection(db, 'subjects'), where('schoolId', '==', profile.schoolId));
    const unsubS = onSnapshot(qS, (snap) => setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject))));
    
    const qC = query(collection(db, 'classes'), where('schoolId', '==', profile.schoolId));
    const unsubC = onSnapshot(qC, (snap) => setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class))));
    
    return () => { unsubS(); unsubC(); };
  }, [profile.schoolId]);

  const addSubject = async () => {
    if (!newSubject) return;
    await addDoc(collection(db, 'subjects'), { name: newSubject, schoolId: profile.schoolId });
    setNewSubject('');
    toast.success("Fənn əlavə edildi");
  };

  const addClass = async () => {
    if (!newClass) return;
    await addDoc(collection(db, 'classes'), { name: newClass, schoolId: profile.schoolId, teacherId: profile.id });
    setNewClass('');
    toast.success("Sinif əlavə edildi");
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Parametrlər</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>Fənlər</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Yeni fənn..." value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              <Button onClick={addSubject}>Əlavə et</Button>
            </div>
            <div className="space-y-2">
              {subjects.map(s => (
                <div key={s.id} className="p-2 bg-muted rounded flex justify-between items-center">
                  <span>{s.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => deleteDoc(doc(db, 'subjects', s.id!))}><LogOut className="h-4 w-4 text-destructive rotate-90" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Siniflər</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Yeni sinif..." value={newClass} onChange={e => setNewClass(e.target.value)} />
              <Button onClick={addClass}>Əlavə et</Button>
            </div>
            <div className="space-y-2">
              {classes.map(c => (
                <div key={c.id} className="p-2 bg-muted rounded flex justify-between items-center">
                  <span>{c.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => deleteDoc(doc(db, 'classes', c.id!))}><LogOut className="h-4 w-4 text-destructive rotate-90" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  if (!user) return <LoginPage />;

  if (!profile) return <CompleteProfile user={user} onComplete={setProfile} />;

  return (
    <Router>
      <div className="flex min-h-screen bg-background">
        <Sidebar profile={profile} />
        <main className="flex-1 bg-muted/20 overflow-y-auto">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard profile={profile} />} />
              <Route path="/journal" element={<Journal profile={profile} />} />
              <Route path="/attendance" element={<Attendance profile={profile} />} />
              <Route path="/schedule" element={<Schedule profile={profile} />} />
              <Route path="/analytics" element={<Analytics profile={profile} />} />
              <Route path="/settings" element={<SettingsPage profile={profile} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}
