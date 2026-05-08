import { useEffect, useMemo, useRef, useState } from "react";
import { Edit, Trash2, CheckCircle, Search, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { studentsAPI, tokensAPI, gradesAPI, toAbsoluteAssetUrl } from "@/lib/api";
import { toast } from "sonner";

type StatusFilter = "all" | "جدید" | "قدیم";
type CategoryFilter = "all" | "Wafaq" | "Non-Wafaq";
type ResidencyFilter = "all" | "مقیم" | "غیر مقیم";
type ApprovalFilter = "all" | "verified" | "pending" | "rejected";
type ClassFilter = "all" | string;

type StudentStatus = "pending" | "verified" | "rejected";

interface StudentRow {
  id: string;
  rollNumber: string;
  name: string;
  fatherName: string;
  class: string;
  admissionDate: string;
  status: StudentStatus;
  statusType?: string;
  residency?: string;
  tokenNumber?: string;
  cnic?: string;
  contact?: string;
  category?: string;
  previousMadrasa?: string;
  previousClass?: string;
  performance?: string;
  wafaqRollNo?: string;
  wafaqMarks?: string;
  notes?: string;
  photoUrl?: string;
  isToken?: boolean;
  formData?: any;
}

function normalizeForFilter(status: StudentStatus): string {
  if (status === "verified") return "approved";
  if (status === "pending") return "pending";
  return "rejected";
}

export default function Counter2Students() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [residencyFilter, setResidencyFilter] = useState<ResidencyFilter>("all");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const [classFilter, setClassFilter] = useState<ClassFilter>("all");
  const [grades, setGrades] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [admissionFormData, setAdmissionFormData] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    fatherName: "",
    class: "",
    cnic: "",
    contact: "",
    category: "",
    residency: "",
    previousMadrasa: "",
    previousClass: "",
    performance: "",
    wafaqRollNo: "",
    wafaqMarks: "",
    notes: "",
    status: "verified" as StudentStatus,
  });

  const refresh = async () => {
    setLoading(true);
    try {
      // Fetch grades for filter
      const gradesRes = await gradesAPI.getAll();
      setGrades(gradesRes.data.data || []);

      // Fetch students from API without status filter (we filter in frontend for "جدید/قدیم")
      const [studentsRes, tokensRes] = await Promise.all([
        studentsAPI.getCounter2({ search: query.trim() || undefined }),
        tokensAPI.getPending(),
      ]);
      
      const studentRows = (studentsRes.data.data ?? []) as any[];
      const tokenRows = (tokensRes.data.data ?? []) as any[];
      
      // Map students with date validation
      let mappedStudents = studentRows.map((s) => {
        let admissionDate = "";
        if (s.verifiedAt) {
          try {
            const date = new Date(s.verifiedAt);
            admissionDate = isNaN(date.getTime()) ? "" : date.toLocaleDateString("ur-PK");
          } catch (e) {
            admissionDate = "";
          }
        } else if (s.createdAt) {
          try {
            const date = new Date(s.createdAt);
            admissionDate = isNaN(date.getTime()) ? "" : date.toLocaleDateString("ur-PK");
          } catch (e) {
            admissionDate = "";
          }
        }
        
        return {
          id: s._id,
          rollNumber: s.admissionNumber || s.tokenNumber,
          name: s.studentName,
          fatherName: s.fatherName,
          class: s.class,
          admissionDate,
          status: s.status,
          statusType: s.formData?.statusType || (s.isNew === false ? "قدیم" : "جدید"),
          residency: s.formData?.residency || s.residency,
          tokenNumber: s.tokenNumber,
          cnic: s.cnic,
          contact: s.contact,
          category: s.formData?.category || s.category,
          previousMadrasa: s.previousMadrasa,
          previousClass: s.previousClass,
          performance: s.performance,
          wafaqRollNo: s.wafaqRollNo,
          wafaqMarks: s.formData?.wafaqMarks || s.wafaqMarks,
          notes: s.notes,
          photoUrl: s.photoUrl ? toAbsoluteAssetUrl(s.photoUrl) : "",
          formData: s.formData,
        };
      });
      
      // Map pending tokens with date validation
      const studentTokenNumbers = new Set(studentRows.map(s => s.tokenNumber).filter(Boolean));
      const mappedTokens = tokenRows
        .filter((t: any) => !studentTokenNumbers.has(t.tokenNumber))
        .map((t: any) => {
          let admissionDate = "";
          if (t.createdAt) {
            try {
              const date = new Date(t.createdAt);
              admissionDate = isNaN(date.getTime()) ? "" : date.toLocaleDateString("ur-PK");
            } catch (e) {
              admissionDate = "";
            }
          }
          
          const fd = t.formData || {};
          return {
            id: t._id,
            rollNumber: t.tokenNumber,
            name: t.studentName || fd.name,
            fatherName: t.fatherName || fd.fatherName,
            class: t.class || fd.desiredGrade,
            admissionDate,
            status: "pending" as StudentStatus,
            statusType: fd.statusType || "جدید",
            residency: fd.residency,
            tokenNumber: t.tokenNumber,
            cnic: t.cnic || fd.cnic,
            contact: t.contact || fd.phone || fd.contact1,
            category: t.category || fd.category,
            previousMadrasa: fd.schoolName || "",
            previousClass: fd.lastGrade || "",
            performance: fd.examMarks || "",
            wafaqRollNo: fd.wafaqRollNo || "",
            wafaqMarks: fd.wafaqMarks || "",
            notes: fd.remarks || "",
            photoUrl: t.photoUrl ? toAbsoluteAssetUrl(t.photoUrl) : (fd.photoUrl ? toAbsoluteAssetUrl(fd.photoUrl) : ""),
            isToken: true,
            formData: t.formData || fd,
          };
        });
      
      // Combine students and tokens
      const combinedRows = [...mappedStudents, ...mappedTokens];
      
      setStudents(combinedRows);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "طلباء لوڈ نہیں ہو سکے");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Load data on mount
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !q ||
        (s.rollNumber?.toLowerCase() || "").includes(q) ||
        (s.name?.toLowerCase() || "").includes(q) ||
        (s.fatherName?.toLowerCase() || "").includes(q) ||
        (s.class?.toLowerCase() || "").includes(q) ||
        (s.tokenNumber?.toLowerCase() || "").includes(q);

      const matchesStatus =
        statusFilter === "all" ? true : s.statusType === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ? true : s.category === categoryFilter;

      const matchesResidency =
        residencyFilter === "all" ? true : s.residency === residencyFilter;

      const matchesApproval =
        approvalFilter === "all" ? true : s.status === approvalFilter;

      const matchesClass =
        classFilter === "all" ? true : s.class === classFilter;

      return matchesQuery && matchesStatus && matchesCategory && matchesResidency && matchesApproval && matchesClass;
    });
  }, [students, query, statusFilter, categoryFilter, residencyFilter, approvalFilter, classFilter]);

  const dynamicGrades = useMemo(() => {
    const uniqueGrades = Array.from(new Set(students.map(s => s.class).filter(Boolean)));
    return uniqueGrades.sort();
  }, [students]);

  const openEdit = (student: StudentRow) => {
    setEditing(student);
    setEditForm({
      name: student.name,
      fatherName: student.fatherName,
      class: student.class,
      cnic: student.cnic ?? "",
      contact: student.contact ?? "",
      category: student.category ?? "",
      residency: student.residency ?? "",
      previousMadrasa: student.previousMadrasa ?? "",
      previousClass: student.previousClass ?? "",
      performance: student.performance ?? "",
      wafaqRollNo: student.wafaqRollNo ?? "",
      wafaqMarks: student.wafaqMarks ?? "",
      notes: student.notes ?? "",
      status: student.status,
    });
    
    // Load admission form data from /verification page
    if (student.tokenNumber) {
      const savedFormData = localStorage.getItem(`admissionForm_${student.tokenNumber}`);
      if (savedFormData) {
        try {
          const parsed = JSON.parse(savedFormData);
          setAdmissionFormData(parsed);
          
          // Populate form fields from admission form
          setEditForm(prev => ({
            ...prev,
            wafaqRollNo: parsed.wafaqRollNo || prev.wafaqRollNo,
            wafaqMarks: parsed.wafaqMarks || prev.wafaqMarks,
            previousClass: parsed.previousClass || parsed.lastGrade || prev.previousClass,
            previousMadrasa: parsed.schoolName || prev.previousMadrasa,
          }));
          
          toast.success("داخلہ فارم کی تفصیلات لوڈ ہو گئیں");
        } catch (e) {
          console.error("Error parsing admission form:", e);
          setAdmissionFormData(null);
        }
      } else {
        setAdmissionFormData(null);
      }
    } else {
      setAdmissionFormData(null);
    }
  };

  const closeEdit = () => {
    setEditing(null);
    setAdmissionFormData(null);
  };

  const sanitizePatch = (data: any) => {
    const next = { ...data };
    if (typeof next.performance === "string" && next.performance.trim() === "") {
      next.performance = undefined;
    }
    return next;
  };

  const saveEdit = () => {
    if (!editing) return;

    (async () => {
      try {
        const status = editForm.status;
        await studentsAPI.updateCounter2(
          editing.id,
          sanitizePatch({
            studentName: editForm.name,
            fatherName: editForm.fatherName,
            class: editForm.class,
            cnic: editForm.cnic,
            contact: editForm.contact,
            category: editForm.category,
            residency: editForm.residency,
            statusType: editing.statusType,
            previousMadrasa: editForm.previousMadrasa,
            previousClass: editForm.previousClass,
            performance: editForm.performance,
            wafaqRollNo: editForm.wafaqRollNo,
            notes: editForm.notes,
            status,
          })
        );
        toast.success("طالب علم اپڈیٹ ہو گیا");
        closeEdit();
        await refresh();
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "اپڈیٹ نہیں ہو سکا");
      }
    })();
  };

  const deleteStudent = (id: string, isToken?: boolean) => {
    (async () => {
      try {
        if (isToken) {
          // Delete from Token collection
          await tokensAPI.deleteMy(id);
        } else {
          // Delete from Student collection
          await studentsAPI.deleteCounter2(id);
        }
        toast.success("حذف ہو گیا");
        await refresh();
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "حذف نہیں ہو سکا");
      }
    })();
  };

  const handleExport = () => {
    if (!filtered.length) {
      toast.message("ایکسپورٹ کے لیے کوئی ریکارڈ موجود نہیں");
      return;
    }

    // Urdu headers for all form fields
    const headers = [
      // Basic Information
      "آئی ڈی",
      "داخلہ نمبر / رول نمبر",
      "نام",
      "ولدیت / والد کا نام",
      "تاریخ پیدائش",
      "قومیت",
      "موجودہ پتہ",
      "مستقل پتہ",
      "رابطہ نمبر",
      "شناختی کارڈ نمبر",
      "پاسپورٹ نمبر",
      "بی فارم نمبر",
      "شناخت کی قسم",
      // Status & Category
      "حیثیت (جدید/قدیم)",
      "تعلیمی حیثیت (وفاقی/غیر وفاقی)",
      "رہائش (مقیم/غیر مقیم)",
      "منظوری کی صورتحال",
      // Admission Details
      "ٹوکن نمبر",
      "تاریخ داخلہ",
      "مطلوبہ درجہ",
      // Previous Education
      "سابقہ مدرسہ/جامعہ",
      "آخری پاس کردہ درجہ",
      "حاصل کردہ نمبرات",
      "وفاقی نمبرات",
      "تقدیر",
      "سال",
      "رقم التسجيل",
      "وفاق رقم الجلوس",
      // Additional Education
      "عصری تعلیم",
      "حافظ قرآن",
      "غیر حافظ قرآن",
      // Guardian Information
      "سرپرست کا نام",
      "سرپرست کی ولدیت",
      "سرپرست کا شناختی کارڈ",
      "سرپرست کا موجودہ پتہ",
      "سرپرست کا پیشہ",
      "سرپرست سے رشتہ",
      "رابطہ نمبر 1",
      "رابطہ نمبر 2",
      // Additional
      "کیفیت / ریمارکس",
    ];

    const escapeCsv = (value: any) => {
      const s = value === null || value === undefined ? "" : String(value);
      const safe = s.replace(/\r\n|\r|\n/g, " ").trim();
      if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
        return `"${safe.replace(/\"/g, '""')}"`;
      }
      return safe;
    };

    // Helper to get formData value with fallback
    const getFormValue = (s: StudentRow, field: string, fallback?: string) => {
      const val = s.formData?.[field] ?? s[field as keyof StudentRow] ?? fallback ?? "";
      return val;
    };

    // Helper to normalize boolean values
    const getBooleanValue = (s: StudentRow, field: string) => {
      const val = s.formData?.[field];
      if (val === true || val === "true" || val === "yes" || val === "ہاں") return "ہاں";
      return "";
    };

    // Helper to format status
    const formatStatus = (status: string) => {
      switch (status) {
        case "verified": return "منظور شدہ";
        case "pending": return "زیر التواء";
        case "rejected": return "مسترد";
        default: return status;
      }
    };

    // Helper to format category
    const formatCategory = (cat: string) => {
      if (cat === "Wafaq") return "وفاقی";
      if (cat === "Non-Wafaq") return "غیر وفاقی";
      return cat || "";
    };

    const rows = filtered.map((s) => [
      // Basic Information
      s.id,
      s.rollNumber,
      s.name,
      s.fatherName,
      getFormValue(s, "dob"),
      getFormValue(s, "nationality", s.cnic ? "ملکی" : ""),
      getFormValue(s, "currentAddress"),
      getFormValue(s, "permanentAddress"),
      s.contact || getFormValue(s, "phone"),
      s.cnic || getFormValue(s, "cnic"),
      getFormValue(s, "passportNumber"),
      getFormValue(s, "bformNumber"),
      getFormValue(s, "idType") === "passport" ? "پاسپورٹ" : getFormValue(s, "idType") === "bform" ? "بی فارم" : "شناختی کارڈ",
      // Status & Category
      s.statusType || getFormValue(s, "statusType", "جدید"),
      formatCategory(s.category || getFormValue(s, "category")),
      s.residency || getFormValue(s, "residency"),
      formatStatus(s.status),
      // Admission Details
      s.tokenNumber || getFormValue(s, "tokenNumber"),
      s.admissionDate || getFormValue(s, "admissionDate"),
      s.class || getFormValue(s, "desiredGrade"),
      // Previous Education
      s.previousMadrasa || getFormValue(s, "schoolName"),
      s.previousClass || getFormValue(s, "lastGrade"),
      s.performance || getFormValue(s, "marks") || getFormValue(s, "examMarks"),
      s.wafaqMarks || getFormValue(s, "wafaqMarks"),
      getFormValue(s, "grade"),
      getFormValue(s, "year"),
      getFormValue(s, "regNo"),
      s.wafaqRollNo || getFormValue(s, "wafaqRollNo"),
      // Additional Education
      getFormValue(s, "worldlyEducation"),
      getBooleanValue(s, "hafizQuran"),
      getBooleanValue(s, "nonHafiz"),
      // Guardian Information
      getFormValue(s, "guardianName"),
      getFormValue(s, "guardianFatherName"),
      getFormValue(s, "guardianCnic"),
      getFormValue(s, "guardianCurrentAddress"),
      getFormValue(s, "occupation"),
      getFormValue(s, "relationship"),
      getFormValue(s, "contact1"),
      getFormValue(s, "contact2"),
      // Additional
      s.notes || getFormValue(s, "remarks"),
    ]);

    const csvText = [headers, ...rows]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF", csvText], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success(`${filtered.length} ریکارڈز ایکسپورٹ ہو گئے`);
  };

  // Helper function to process each Excel row with DYNAMIC header mapping
  // Uses the exact headers from the first row of Excel as field names
  const processExcelRow = (row: any[], headers: string[], sheetName: string): any => {
    const student: any = {
      status: "pending",
      formData: {
        excelSheetName: sheetName
      }
    };

    // Helper to normalize text for matching (but keep original for storage)
    const normalizeText = (text: string): string => {
      return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[ًٌٍَُِّْ]/g, ''); // Remove Arabic diacritics
    };

    // Common field name mappings for core fields (flexible matching)
    const coreFieldMappings: Record<string, string[]> = {
      // Picture 1 - Main Table Fields (Visible in list)
      rollNumber: ["داخلہ نمبر / رول نمبر", "رول نمبر", "roll number", "dakhla number", "id", "آئی ڈی"],
      studentName: ["نام", "name", "student name", "طالب علم کا نام"],
      fatherName: ["ولدیت / والد کا نام", "والد کا نام", "ولدیت", "father name", "father"],
      class: ["درجہ", "مطلوبہ درجہ", "class", "grade", "degree"],
      category: ["تعلیمی حیثیت", "تعلیمی حیثیت (وفاقی/غیر وفاقی)", "category", "type", "wafaq"],
      residency: ["رہائش", "رہائش (مقیم/غیر مقیم)", "residency", "resident", "hostel"],
      statusType: ["حیثیت (جدید/قدیم)", "حیثیت", "نوعیت", "status type", "type", "جدید/قدیم"],
      admissionDate: ["تاریخ داخلہ", "admission date", "dakhla date"],
      status: ["منظوری کی صورتحال", "approval status", "status", "verified", "pending", "rejected"],
      
      // Form Edit Fields (Hidden in main table, visible in edit form)
      tokenNumber: ["ٹوکن نمبر", "token", "token number", "فارم نمبر", "form no", "form number"],
      dateOfBirth: ["تاریخ پیدائش", "dob", "date of birth", "birth date"],
      nationality: ["قومیت", "nationality", "country"],
      currentAddress: ["موجودہ پتہ", "current address", "present address"],
      permanentAddress: ["مستقل پتہ", "permanent address", "home address"],
      contact: ["رابطہ نمبر", "contact", "phone", "mobile", "رابطہ"],
      cnic: ["شناختی کارڈ نمبر", "شناختی کارڈ", "cnic", "id card", "id number", "b-form"],
      passportNumber: ["پاسپورٹ نمبر", "passport number", "passport"],
      bformNumber: ["بی فارم نمبر", "bform number", "b-form number"],
      idType: ["شناخت کی قسم", "id type", "identity type"],
      desiredGrade: ["مطلوبہ درجہ", "desired grade", "target grade"],
      previousMadrasa: ["سابقہ مدرسہ/جامعہ", "سابقہ مدرسہ", "previous madrasa", "school name", "former school"],
      previousClass: ["آخری پاس کردہ درجہ", "last grade", "previous class"],
      performance: ["حاصل کردہ نمبرات", "marks", "performance", "obtained marks"],
      wafaqMarks: ["وفاقی نمبرات", "wafaq marks", "wifaq marks"],
      grade: ["تقدیر", "grade", "result"],
      year: ["سال", "year", "session"],
      regNo: ["رقم التسجيل", "reg no", "registration number"],
      wafaqRollNo: ["وفاق رقم الجلوس", "رقم الجلوس", "wafaq roll no", "wifaq roll number"],
      worldlyEducation: ["عصری تعلیم", "worldly education", "secular education"],
      hafizQuran: ["حافظ قرآن", "hafiz quran", "hafiz"],
      nonHafiz: ["غیر حافظ قرآن", "non hafiz", "non-hafiz"],
      guardianName: ["سرپرست کا نام", "guardian name", "guardian"],
      guardianFatherName: ["سرپرست کی ولدیت", "guardian father name"],
      guardianCnic: ["سرپرست کا شناختی کارڈ", "guardian cnic", "guardian id card"],
      guardianCurrentAddress: ["سرپرست کا موجودہ پتہ", "guardian current address"],
      occupation: ["سرپرست کا پیشہ", "occupation", "profession"],
      relationship: ["سرپرست سے رشتہ", "relationship", "relation"],
      contact1: ["رابطہ نمبر 1", "contact 1", "phone 1", "mobile 1"],
      contact2: ["رابطہ نمبر 2", "contact 2", "phone 2", "mobile 2"],
      remarks: ["کیفیت / ریمارکس", "کیفیت", "remarks", "notes", "comments"],
    };

    // Find core field by matching against known variations
    const findCoreField = (header: string): string | null => {
      const normalizedHeader = normalizeText(header);
      
      for (const [coreField, variations] of Object.entries(coreFieldMappings)) {
        // Direct match with variations
        for (const variation of variations) {
          if (normalizeText(variation) === normalizedHeader) {
            return coreField;
          }
        }
        // Check if header contains the variation or vice versa
        for (const variation of variations) {
          const normVar = normalizeText(variation);
          if (normalizedHeader.includes(normVar) || normVar.includes(normalizedHeader)) {
            return coreField;
          }
        }
      }
      return null;
    };

    // Process each cell and store with original header name in formData
    row.forEach((cell, colIndex) => {
      const originalHeader = headers[colIndex];
      if (!originalHeader) return;

      // Convert cell value to string
      let val: string;
      if (cell instanceof Date) {
        val = cell.toISOString().split('T')[0];
      } else if (typeof cell === 'number') {
        val = String(cell);
      } else {
        val = String(cell || "").trim();
      }
      
      if (!val || val === 'undefined' || val === 'null') return;

      // ALWAYS store in formData with the ORIGINAL header name (as-is from Excel)
      student.formData[originalHeader] = val;

      // Also try to map to core fields for system compatibility
      const coreField = findCoreField(originalHeader);
      
      if (coreField) {
        switch (coreField) {
          case 'tokenNumber':
            student.tokenNumber = val;
            break;
          case 'rollNumber':
            student.rollNumber = val;
            break;
          case 'status':
            let statusVal = val;
            const statusTrimmed = val.trim();
            // Map Urdu status values to English enum values
            if (statusTrimmed.includes('منظور') || statusTrimmed.toLowerCase().includes('verified')) {
              statusVal = 'verified';
            } else if (statusTrimmed.includes('زیر') || statusTrimmed.includes('التواء') || statusTrimmed.toLowerCase().includes('pending')) {
              statusVal = 'pending';
            } else if (statusTrimmed.includes('مسترد') || statusTrimmed.toLowerCase().includes('rejected')) {
              statusVal = 'rejected';
            }
            student.status = statusVal;
            break;
          case 'studentName':
            student.studentName = val;
            break;
          case 'fatherName':
            student.fatherName = val;
            break;
          case 'class':
            student.class = val;
            student.formData.desiredGrade = val;
            break;
          case 'category':
            let catVal = val;
            const trimmedVal = val.trim();
            const lowerVal = trimmedVal.toLowerCase();
            // Only set valid category values
            if (lowerVal.includes('non') || trimmedVal.includes('غیر') || trimmedVal.includes('غیر وفاقی') || trimmedVal.includes('غیروفاقی')) {
              catVal = 'Non-Wafaq';
            } else if (lowerVal.includes('wafaq') || trimmedVal.includes('وفاق') || trimmedVal.includes('وفاقی')) {
              catVal = 'Wafaq';
            } else if (trimmedVal === 'جدید' || trimmedVal === 'قدیم') {
              // These are statusType values, not category - don't set invalid category
              catVal = '';
            } else if (trimmedVal && trimmedVal !== '') {
              // Try to detect based on common patterns
              if (trimmedVal.includes('غیر') || trimmedVal.includes('non') || trimmedVal.includes('NOn')) {
                catVal = 'Non-Wafaq';
              } else if (trimmedVal.includes('وفاق')) {
                catVal = 'Wafaq';
              } else {
                // Unknown value - log it and don't set
                console.log(`Unknown category value: "${trimmedVal}"`);
                catVal = '';
              }
            } else {
              catVal = '';
            }
            if (catVal) {
              student.category = catVal;
              student.formData.category = catVal;
            }
            break;
          case 'statusType':
            let statusTypeVal = val;
            if (val.includes('جدید') || val.toLowerCase().includes('new')) {
              statusTypeVal = 'جدید';
            } else if (val.includes('قدیم') || val.toLowerCase().includes('old')) {
              statusTypeVal = 'قدیم';
            }
            student.formData.statusType = statusTypeVal;
            break;
          case 'residency':
            let residencyVal = val;
            // Expanded matching for residency values
            const normalizedVal = val.toLowerCase().trim();
            if (val.includes('غیر') || normalizedVal.includes('non') || normalizedVal.includes('day') || normalizedVal.includes('غیرمقیم') || normalizedVal.includes('غیر مقیم')) {
              residencyVal = 'غیر مقیم';
            } else if (val.includes('مقيم') || val.includes('مقیم') || normalizedVal.includes('resident') || normalizedVal.includes('hostel') || normalizedVal.includes('مق')) {
              // Catch partial 'مق' as 'مقيم'
              residencyVal = 'مقيم';
            } else {
              // Invalid value - don't set it
              residencyVal = '';
            }
            if (residencyVal) {
              student.residency = residencyVal;
              student.formData.residency = residencyVal;
            }
            break;
          case 'wafaqRollNo':
            student.wafaqRollNo = val;
            break;
          case 'contact':
            student.contact = val;
            break;
          case 'cnic':
            student.cnic = val;
            break;
          case 'remarks':
            student.notes = val;
            break;
          case 'dateOfBirth':
            student.formData.dob = val;
            break;
          case 'currentAddress':
            student.formData.currentAddress = val;
            break;
          case 'permanentAddress':
            student.formData.permanentAddress = val;
            break;
          case 'guardianName':
            student.formData.guardianName = val;
            break;
          case 'guardianPhone':
          case 'contact1':
            student.formData.contact1 = val;
            break;
          case 'contact2':
            student.formData.contact2 = val;
            break;
          case 'admissionDate':
            student.admissionDate = val;
            student.formData.admissionDate = val;
            break;
          case 'previousMadrasa':
          case 'schoolName':
            student.previousMadrasa = val;
            student.formData.schoolName = val;
            break;
          case 'previousClass':
          case 'lastGrade':
            student.previousClass = val;
            student.formData.lastGrade = val;
            break;
          case 'performance':
          case 'marks':
          case 'examMarks':
            student.performance = val;
            student.formData.marks = val;
            student.formData.examMarks = val;
            break;
          case 'wafaqMarks':
            student.wafaqMarks = val;
            student.formData.wafaqMarks = val;
            break;
          case 'dob':
            student.formData.dob = val;
            break;
          case 'desiredGrade':
            student.formData.desiredGrade = val;
            break;
          case 'phone':
            student.contact = val;
            student.formData.phone = val;
            break;
          case 'passportNumber':
            student.formData.passportNumber = val;
            break;
          case 'bformNumber':
            student.formData.bformNumber = val;
            break;
          case 'idType':
            student.formData.idType = val;
            break;
          case 'nationality':
            student.formData.nationality = val;
            break;
          case 'grade':
            student.formData.grade = val;
            break;
          case 'year':
            student.formData.year = val;
            break;
          case 'regNo':
            student.formData.regNo = val;
            break;
          case 'worldlyEducation':
            student.formData.worldlyEducation = val;
            break;
          case 'hafizQuran':
            student.formData.hafizQuran = val === 'ہاں' || val === 'true' || val === 'yes';
            break;
          case 'nonHafiz':
            student.formData.nonHafiz = val === 'ہاں' || val === 'true' || val === 'yes';
            break;
          case 'guardianFatherName':
            student.formData.guardianFatherName = val;
            break;
          case 'guardianCnic':
            student.formData.guardianCnic = val;
            break;
          case 'guardianCurrentAddress':
            student.formData.guardianCurrentAddress = val;
            break;
          case 'occupation':
            student.formData.occupation = val;
            break;
          case 'relationship':
            student.formData.relationship = val;
            break;
          default:
            // For other core fields, set directly on student
            student[coreField] = val;
        }
      }
    });

    // Ensure we have at least a name or token to consider this a valid record
    // But allow any data - even single field records
    const hasAnyData = Object.keys(student).some(key => {
      if (key === 'formData') {
        return Object.keys(student.formData).length > 1; // More than just excelSheetName
      }
      return !!student[key];
    });

    return hasAnyData ? student : null;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportProgress({ current: 0, total: 0 });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      
      let allStudents: any[] = [];
      
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(ws, { 
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd'
        }) as any[][];
        
        if (jsonData.length < 2) continue;
        
        const headers = jsonData[0].map((h: any) => String(h || "").trim().replace(/\s+/g, ' '));
        const rows = jsonData.slice(1).filter(row => 
          row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== "")
        );
        
        setImportProgress({ current: 0, total: rows.length });
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const student = processExcelRow(row, headers, sheetName);
          const hasAnyData = Object.keys(student).some(key => {
            if (key === 'formData') {
              return Object.keys(student.formData).length > 1;
            }
            return !!student[key];
          });
          if (hasAnyData) {
            allStudents.push(student);
          }
          setImportProgress({ current: i + 1, total: rows.length });
        }
      }

      if (allStudents.length === 0) {
        toast.error("کوئی ڈیٹا نہیں ملا");
        return;
      }
      
      console.log(`Importing ${allStudents.length} students from Excel`);

      const BATCH_SIZE = 50;
      let importedCount = 0;

      for (let i = 0; i < allStudents.length; i += BATCH_SIZE) {
        const batch = allStudents.slice(i, i + BATCH_SIZE);
        try {
          const res = await studentsAPI.bulkCreate(batch);
          if (res.data.success) {
            importedCount += res.data.count;
          }
        } catch (batchErr: any) {
          console.error("Batch import error:", batchErr);
          toast.error(`Batch ${i/BATCH_SIZE + 1} import failed: ${batchErr?.response?.data?.message || 'Unknown error'}`);
        }
        setImportProgress({ current: Math.min(i + BATCH_SIZE, allStudents.length), total: allStudents.length });
      }

      if (importedCount > 0) {
        toast.success(`${importedCount} طلباء کامیابی سے امپورٹ ہو گئے!`);
        
        try {
          const currentGrades = grades.map(g => g.name);
          const newGradesFromImport = Array.from(new Set(allStudents.map(s => s.class).filter(Boolean)));
          
          for (const gradeName of newGradesFromImport) {
            if (!currentGrades.includes(gradeName)) {
              await gradesAPI.create({ name: gradeName });
            }
          }
        } catch (gradeErr) {
          console.error("Error creating new grades:", gradeErr);
        }
        
        await refresh();
      } else {
        toast.error("کوئی طالب علم امپورٹ نہیں ہو سکا");
      }
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(err?.response?.data?.message || "فائل امپورٹ کرنے میں غلطی ہوئی");
    } finally {
      setImportLoading(false);
      setImportProgress({ current: 0, total: 0 });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAll = async () => {
    try {
      await studentsAPI.deleteAll();
      // Clear local storage tokens
      localStorage.removeItem('jamia_tokens_v1');
      toast.success("تمام ڈیٹا حذف کر دیا گیا");
      setStudents([]);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "ڈیٹا حذف نہیں ہو سکا");
    }
  };

  return (
    <DashboardLayout title="طلباء مینجمنٹ">
      <PageHeader
        title="طلباء"
        description="یہاں سے طلباء (منظور شدہ / زیرِ التواء / مسترد) دیکھیں، اپڈیٹ کریں یا حذف کریں"
        action={
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx, .xls, .csv"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 ml-2" />
              درآمد
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 ml-2" />
              برآمد
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تمام ڈیٹا حذف کریں؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    کیا آپ واقعی تمام طلباء کا ڈیٹا حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں لیا جا سکتا۔
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>منسوخ</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    حذف کریں
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>تلاش اور فلٹر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="رول نمبر، نام، والد کا نام، درجہ یا ٹوکن سے تلاش کریں"
            className="h-12"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>حیثیت</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="حیثیت منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام</SelectItem>
                  <SelectItem value="جدید">جدید</SelectItem>
                  <SelectItem value="قدیم">قدیم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>تعلیمی حیثیت</Label>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="تعلیمی حیثیت منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام</SelectItem>
                  <SelectItem value="Wafaq">وفاقی</SelectItem>
                  <SelectItem value="Non-Wafaq">غیر وفاقی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>رہائش</Label>
              <Select value={residencyFilter} onValueChange={(v) => setResidencyFilter(v as ResidencyFilter)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="رہائش منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام</SelectItem>
                  <SelectItem value="مقیم">مقیم</SelectItem>
                  <SelectItem value="غیر مقیم">غیر مقیم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>منظوری کی صورتحال</Label>
              <Select value={approvalFilter} onValueChange={(v) => setApprovalFilter(v as ApprovalFilter)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="منظوری کی صورتحال" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام</SelectItem>
                  <SelectItem value="verified">منظور شدہ</SelectItem>
                  <SelectItem value="pending">زیر التواء</SelectItem>
                  <SelectItem value="rejected">مسترد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>درجہ</Label>
              <Select value={classFilter} onValueChange={(v) => setClassFilter(v as ClassFilter)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="درجہ منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام</SelectItem>
                  {dynamicGrades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تمام طلباء ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-10">
              لوڈ ہو رہا ہے...
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رول نمبر</TableHead>
                <TableHead className="text-right">نام</TableHead>
                <TableHead className="text-right">والد کا نام</TableHead>
                <TableHead className="text-right">درجہ</TableHead>
                <TableHead className="text-right">تعلیمی حیثیت</TableHead>
                <TableHead className="text-right">رہائش</TableHead>
                <TableHead className="text-right">حیثیت (جدید/قدیم)</TableHead>
                <TableHead className="text-right">تاریخ داخلہ</TableHead>
                <TableHead className="text-right">منظوری کی صورتحال</TableHead>
                <TableHead className="text-right">عمل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-semibold">{s.rollNumber}</TableCell>
                    <TableCell className="font-semibold">{s.name}</TableCell>
                    <TableCell>{s.fatherName}</TableCell>
                    <TableCell>{s.class}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {s.category === "Wafaq" ? "وفاقی" : s.category === "Non-Wafaq" ? "غیر وفاقی" : s.category || "---"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {s.residency || "---"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {s.statusType || "---"}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.admissionDate}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Save student details to localStorage so Verification page can pick it up
                            localStorage.setItem(`temp_edit_student_${s.tokenNumber || s.rollNumber}`, JSON.stringify(s));
                            navigate(`/verification?token=${encodeURIComponent(s.tokenNumber || s.rollNumber || "")}`);
                          }}
                        >
                          فارم ایڈٹ
                        </Button>

                        <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                          <Edit className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>طالب علم حذف کریں؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                یہ ریکارڈ مستقل طور پر حذف ہو جائے گا۔
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>منسوخ</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteStudent(s.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف کریں
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    کوئی طالب علم نہیں ملا
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>منظوری کی صورتحال</DialogTitle>
            <DialogDescription>طالب علم کی منظوری کی حیثیت تبدیل کریں</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>منظوری کی صورتحال</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v as StudentStatus })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="منظوری کی صورتحال منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">منظور شدہ</SelectItem>
                  <SelectItem value="pending">زیرِ التواء</SelectItem>
                  <SelectItem value="rejected">مسترد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={saveEdit}>
                محفوظ کریں
              </Button>
              <Button className="flex-1" variant="outline" onClick={closeEdit}>
                منسوخ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Loading Overlay */}
      {importLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <div className="text-center">
                <p className="text-lg font-semibold">ڈیٹا امپورٹ ہو رہا ہے...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importProgress.total > 0 && (
                    <>
                      {importProgress.current} / {importProgress.total} ریکارڈز
                    </>
                  )}
                </p>
                {importProgress.total > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
