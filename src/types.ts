export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface School {
  id: string;
  name: string;
  address?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId: string;
  classId?: string;
  teacherCode?: string;
}

export interface Class {
  id: string;
  name: string;
  schoolId: string;
  teacherId: string; // Curator
}

export interface Subject {
  id: string;
  name: string;
  schoolId: string;
}

export interface Lesson {
  id: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  date: string;
  room?: string;
  type: 'regular' | 'KR' | 'SR' | 'DZ';
  topic?: string;
}

export interface Grade {
  id: string;
  lessonId: string;
  studentId: string;
  value: string; // Changed to string to support 5+, 5-
  weight: number;
  comment?: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId?: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  schoolId: string;
}
