import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  Bell, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  Database,
  ArrowRight
} from 'lucide-react';

export default function Dashboard({ profile }: { profile: UserProfile }) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Xoş gəldiniz, {profile.name}!</h1>
          <p className="text-muted-foreground">Bu gün {new Date().toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Növbəti dərslər</CardTitle>
            <CardDescription>Bugünkü cədvəliniz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Bu gün üçün dərs tapılmadı</p>
            </div>
            <Button variant="ghost" className="w-full group">
              Bütün cədvələ bax <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Elanlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Müəllimlər iclası
              </div>
              <p className="text-xs text-muted-foreground ml-6">Sabah saat 15:00-da akt zalında.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-orange-500" />
                Hesabatların təhvili
              </div>
              <p className="text-xs text-muted-foreground ml-6">Rüblük qiymətlər üzrə son tarix - cümə günü.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
