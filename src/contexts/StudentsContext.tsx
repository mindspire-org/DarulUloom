import * as React from "react";
import { students as seedStudents } from "@/data/mockData";

export type StudentStatus = "active" | "pending" | "approved" | "rejected";

export interface StudentRecord {
  id: string;
  name: string;
  fatherName: string;
  class: string;
  rollNumber: string;
  status: StudentStatus;
  admissionDate: string;
  tokenNumber?: string;

  cnic?: string;
  contact?: string;
  category?: string;
  photoUrl?: string;

  previousMadrasa?: string;
  previousClass?: string;
  performance?: string;
  wafaqRollNo?: string;
  notes?: string;
}

interface StudentsContextValue {
  students: StudentRecord[];
  upsertStudent: (student: StudentRecord) => void;
  updateStudent: (id: string, patch: Partial<StudentRecord>) => void;
  deleteStudent: (id: string) => void;
}

const StudentsContext = React.createContext<StudentsContextValue | null>(null);

const STORAGE_KEY = "jamia_students_v1";

function safeParseStudents(raw: string | null): StudentRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as StudentRecord[];
  } catch {
    return [];
  }
}

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = React.useState<StudentRecord[]>(() => {
    const stored = safeParseStudents(localStorage.getItem(STORAGE_KEY));
    if (stored.length > 0) return stored;

    return seedStudents.map((s) => ({
      id: s.id,
      name: s.name,
      fatherName: s.fatherName,
      class: s.class,
      rollNumber: s.rollNumber,
      status: s.status,
      admissionDate: s.admissionDate,
      tokenNumber: s.tokenNumber,
    }));
  });

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  const upsertStudent = React.useCallback((student: StudentRecord) => {
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.id === student.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...prev[idx], ...student };
        return next;
      }
      return [student, ...prev];
    });
  }, []);

  const updateStudent = React.useCallback((id: string, patch: Partial<StudentRecord>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteStudent = React.useCallback((id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const value = React.useMemo<StudentsContextValue>(
    () => ({ students, upsertStudent, updateStudent, deleteStudent }),
    [students, upsertStudent, updateStudent, deleteStudent],
  );

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>;
}

export function useStudents() {
  const ctx = React.useContext(StudentsContext);
  if (!ctx) throw new Error("useStudents must be used within a StudentsProvider");
  return ctx;
}
