// Mock data for the Madrasa Admin Dashboard

export interface Student {
  id: string;
  name: string;
  fatherName: string;
  class: string;
  rollNumber: string;
  status: 'active' | 'pending' | 'approved' | 'rejected';
  admissionDate: string;
  tokenNumber?: string;
}

export interface Token {
  id: string;
  tokenNumber: string;
  studentName: string;
  fatherName: string;
  class: string;
  issueDate: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface DashboardStats {
  totalStudents: number;
  newAdmissions: number;
  pending: number;
  approved: number;
}

// Classes available in the madrasa
export const classes = [
  'حفظ',
  'ناظرہ',
  'درجہ اول',
  'درجہ دوم',
  'درجہ ثالث',
  'درجہ رابع',
  'درجہ خامس',
  'درجہ سادس',
  'درجہ سابع',
  'دورہ حدیث',
];

// Sample students data
export const students: Student[] = [
  {
    id: '1',
    name: 'محمد احمد',
    fatherName: 'محمد علی',
    class: 'درجہ ثالث',
    rollNumber: '2024-001',
    status: 'active',
    admissionDate: '2024-01-15',
    tokenNumber: 'TK-001',
  },
  {
    id: '2',
    name: 'عبداللہ خان',
    fatherName: 'اسلم خان',
    class: 'حفظ',
    rollNumber: '2024-002',
    status: 'approved',
    admissionDate: '2024-01-20',
    tokenNumber: 'TK-002',
  },
  {
    id: '3',
    name: 'یوسف رضا',
    fatherName: 'ممتاز رضا',
    class: 'ناظرہ',
    rollNumber: '2024-003',
    status: 'pending',
    admissionDate: '2024-02-01',
    tokenNumber: 'TK-003',
  },
  {
    id: '4',
    name: 'حسن محمود',
    fatherName: 'محمود احمد',
    class: 'درجہ رابع',
    rollNumber: '2024-004',
    status: 'active',
    admissionDate: '2024-02-10',
    tokenNumber: 'TK-004',
  },
  {
    id: '5',
    name: 'بلال احمد',
    fatherName: 'نعیم احمد',
    class: 'درجہ سادس',
    rollNumber: '2024-005',
    status: 'pending',
    admissionDate: '2024-02-15',
    tokenNumber: 'TK-005',
  },
  {
    id: '6',
    name: 'عمران فاروق',
    fatherName: 'فاروق صاحب',
    class: 'دورہ حدیث',
    rollNumber: '2024-006',
    status: 'approved',
    admissionDate: '2024-02-20',
    tokenNumber: 'TK-006',
  },
  {
    id: '7',
    name: 'سعد خالد',
    fatherName: 'خالد محمود',
    class: 'درجہ اول',
    rollNumber: '2024-007',
    status: 'rejected',
    admissionDate: '2024-03-01',
    tokenNumber: 'TK-007',
  },
  {
    id: '8',
    name: 'فہد عباس',
    fatherName: 'عباس علی',
    class: 'درجہ دوم',
    rollNumber: '2024-008',
    status: 'active',
    admissionDate: '2024-03-05',
    tokenNumber: 'TK-008',
  },
];

// Sample tokens data
export const tokens: Token[] = [
  {
    id: '1',
    tokenNumber: 'TK-001',
    studentName: 'محمد احمد',
    fatherName: 'محمد علی',
    class: 'درجہ ثالث',
    issueDate: '2024-01-15',
    status: 'verified',
  },
  {
    id: '2',
    tokenNumber: 'TK-002',
    studentName: 'عبداللہ خان',
    fatherName: 'اسلم خان',
    class: 'حفظ',
    issueDate: '2024-01-20',
    status: 'verified',
  },
  {
    id: '3',
    tokenNumber: 'TK-003',
    studentName: 'یوسف رضا',
    fatherName: 'ممتاز رضا',
    class: 'ناظرہ',
    issueDate: '2024-02-01',
    status: 'pending',
  },
  {
    id: '4',
    tokenNumber: 'TK-004',
    studentName: 'حسن محمود',
    fatherName: 'محمود احمد',
    class: 'درجہ رابع',
    issueDate: '2024-02-10',
    status: 'verified',
  },
  {
    id: '5',
    tokenNumber: 'TK-005',
    studentName: 'بلال احمد',
    fatherName: 'نعیم احمد',
    class: 'درجہ سادس',
    issueDate: '2024-02-15',
    status: 'pending',
  },
];

// Dashboard statistics
export const dashboardStats: DashboardStats = {
  totalStudents: 156,
  newAdmissions: 24,
  pending: 12,
  approved: 138,
};

// Recent activity for dashboard
export const recentActivity = students.slice(0, 5);

// Get status label in Urdu
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'فعال',
    pending: 'زیر التوا',
    approved: 'منظور شدہ',
    rejected: 'مسترد',
    verified: 'تصدیق شدہ',
  };
  return labels[status] || status;
};

// Generate a new token number in format YYMMDD-XXX (e.g., 260308-001)
export const generateTokenNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
  const day = String(now.getDate()).padStart(2, '0'); // 01-31
  const datePrefix = `${year}${month}${day}`;
  
  // Get existing tokens from localStorage to find the next sequence number
  const existingTokens = JSON.parse(localStorage.getItem("jamia_tokens_v1") || "[]");
  
  // Find all tokens for today
  const todaysTokens = existingTokens.filter((t: any) => 
    t.tokenNumber && t.tokenNumber.startsWith(datePrefix)
  );
  
  // Get the highest sequence number for today
  let maxSequence = 0;
  todaysTokens.forEach((t: any) => {
    const parts = t.tokenNumber.split('-');
    if (parts.length === 2) {
      const seq = parseInt(parts[1], 10);
      if (!isNaN(seq) && seq > maxSequence) {
        maxSequence = seq;
      }
    }
  });
  
  // Next sequence number
  const nextSequence = maxSequence + 1;
  const sequenceStr = String(nextSequence).padStart(3, '0'); // 001, 002, etc.
  
  return `${datePrefix}-${sequenceStr}`;
};
