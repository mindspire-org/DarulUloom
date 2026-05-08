import { useEffect, useState, useRef } from "react";
import { Search, ShieldCheck, Upload, X, CheckCircle, Clock, XCircle, ExternalLink, Copy } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { studentsAPI, toAbsoluteAssetUrl } from "@/lib/api";
import { toast } from "sonner";
import { PhoneInput } from "@/components/admission/CharacterBoxInputs";

// ─── Types ──────────────────────────────────────────────────────────────────

interface StudentRow {
    _id: string;
    tokenNumber: string;
    studentName: string;
    fatherName: string;
    class: string;
    category: "Wafaq" | "Non-Wafaq" | string;
    status: string;
    // Federal fields
    wafaqRollNo?: string;
    wafaqExamYear?: string;
    previousClass?: string;
    federalVerificationStatus?: "pending" | "eligible" | "not_eligible";
    verifiedBy?: { name: string; username: string } | null;
    verifiedAt?: string;
    // Non-Federal fields
    previousMadrasa?: string;
    madrasaContact?: string;
    certificateUrl?: string;
    nonFederalReviewStatus?: "pending" | "approved" | "rejected";
    nonFederalReviewedBy?: { name: string; username: string } | null;
    nonFederalReviewedAt?: string;
    // Notes
    notes?: string;
}

// ─── Badge helpers ───────────────────────────────────────────────────────────

function FederalStatusBadge({ status }: { status?: string }) {
    if (status === "eligible")
        return (
            <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                <CheckCircle className="h-3 w-3" /> اہل
            </Badge>
        );
    if (status === "not_eligible")
        return (
            <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
                <XCircle className="h-3 w-3" /> غیر اہل
            </Badge>
        );
    return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
            <Clock className="h-3 w-3" /> زیرِ التواء
        </Badge>
    );
}

function NonFederalStatusBadge({ status }: { status?: string }) {
    if (status === "approved")
        return (
            <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                <CheckCircle className="h-3 w-3" /> منظور
            </Badge>
        );
    if (status === "rejected")
        return (
            <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
                <XCircle className="h-3 w-3" /> مسترد
            </Badge>
        );
    return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
            <Clock className="h-3 w-3" /> زیرِ التواء
        </Badge>
    );
}

function CategoryBadge({ category }: { category: string }) {
    return category === "Wafaq" ? (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            وفاقی (Federal)
        </Badge>
    ) : (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            غیر وفاقی (Non-Federal)
        </Badge>
    );
}

// ─── Date formatter ──────────────────────────────────────────────────────────

function fmtDate(d?: string) {
    if (!d) return "—";
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("ur-PK");
    } catch (e) {
        return "—";
    }
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function Counter2Verification() {
    const isElectron = Boolean((window as any)?.electron?.isElectron);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [studentType, setStudentType] = useState<"Wafaq" | "Non-Wafaq">("Wafaq");
    // Federal
    const [rollNo, setRollNo] = useState("");
    const [examYear, setExamYear] = useState("");
    const [prevClass, setPrevClass] = useState("");
    const [federalStatus, setFederalStatus] = useState<string>("pending");
    const [showWafaqIframe, setShowWafaqIframe] = useState(false);
    // Non-Federal
    const [prevMadrasa, setPrevMadrasa] = useState("");
    const [madrasaContact, setMadrasaContact] = useState("");
    const [nonFederalStatus, setNonFederalStatus] = useState<string>("pending");
    const [certFile, setCertFile] = useState<File | null>(null);
    const [certPreviewUrl, setCertPreviewUrl] = useState<string>("");
    // Admission form data state
    const [admissionFormData, setAdmissionFormData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // ── Load students ──────────────────────────────────────────────────────────

    const loadStudents = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search.trim()) params.search = search.trim();
            if (categoryFilter !== "all") params.category = categoryFilter;
            
            const res = await studentsAPI.getForVerification(params);
            let rows = (res.data.data ?? []) as StudentRow[];
            
            // If API returns data, use it
            if (rows.length > 0) {
                setStudents(rows);
            } else {
                // If API returns empty, or we want to ensure we have data from localStorage too
                // Fallback to localStorage filtering
                const tokensData = localStorage.getItem("jamia_tokens_v1");
                if (tokensData) {
                    try {
                        const tokens = JSON.parse(tokensData);
                        let matchingTokens = tokens;
                        
                        // Apply search filter
                        if (search.trim()) {
                            const searchLower = search.toLowerCase();
                            matchingTokens = matchingTokens.filter((t: any) => 
                                t.tokenNumber?.toLowerCase().includes(searchLower) ||
                                t.studentName?.toLowerCase().includes(searchLower) ||
                                t.fatherName?.toLowerCase().includes(searchLower)
                            );
                        }
                        
                        // Apply category filter
                        if (categoryFilter !== "all") {
                            matchingTokens = matchingTokens.filter((t: any) => 
                                t.category === categoryFilter
                            );
                        }
                        
                        const filteredRows = matchingTokens.map((t: any) => ({
                            _id: t.id || Date.now().toString(),
                            tokenNumber: t.tokenNumber,
                            studentName: t.studentName,
                            fatherName: t.fatherName,
                            class: t.class,
                            category: t.category || "Wafaq",
                            status: t.status || "pending",
                            federalVerificationStatus: t.federalVerificationStatus || "pending",
                            nonFederalReviewStatus: t.nonFederalReviewStatus || "pending",
                        }));
                        
                        setStudents(filteredRows);
                    } catch (e) {
                        console.error("Error filtering localStorage:", e);
                    }
                }
            }
        } catch (e: any) {
            console.error("API Load failed, using localStorage fallback:", e);
            
            // Fallback: Load and filter from localStorage on API error
            const tokensData = localStorage.getItem("jamia_tokens_v1");
            if (tokensData) {
                try {
                    const tokens = JSON.parse(tokensData);
                    let matchingTokens = tokens;
                    
                    if (search.trim()) {
                        const searchLower = search.toLowerCase();
                        matchingTokens = matchingTokens.filter((t: any) => 
                            t.tokenNumber?.toLowerCase().includes(searchLower) ||
                            t.studentName?.toLowerCase().includes(searchLower) ||
                            t.fatherName?.toLowerCase().includes(searchLower)
                        );
                    }
                    
                    if (categoryFilter !== "all") {
                        matchingTokens = matchingTokens.filter((t: any) => 
                            t.category === categoryFilter
                        );
                    }
                    
                    const rows = matchingTokens.map((t: any) => ({
                        _id: t.id || Date.now().toString(),
                        tokenNumber: t.tokenNumber,
                        studentName: t.studentName,
                        fatherName: t.fatherName,
                        class: t.class,
                        category: t.category || "Wafaq",
                        status: t.status || "pending",
                        federalVerificationStatus: t.federalVerificationStatus || "pending",
                        nonFederalReviewStatus: t.nonFederalReviewStatus || "pending",
                    }));
                    
                    setStudents(rows);
                } catch (err) {
                    console.error("Error loading from localStorage fallback:", err);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryFilter]);

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => loadStudents(), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const openStudent = (s: StudentRow) => {
        setSelectedStudent(s);
        const type = (s.category === "Wafaq" ? "Wafaq" : "Non-Wafaq") as "Wafaq" | "Non-Wafaq";
        setStudentType(type);

        // Federal
        setRollNo(s.wafaqRollNo || "");
        setExamYear(s.wafaqExamYear || "");
        setPrevClass(s.previousClass || "");
        setFederalStatus(s.federalVerificationStatus || "pending");

        // Non-Federal
        setPrevMadrasa(s.previousMadrasa || "");
        setMadrasaContact(s.madrasaContact || "");
        setNonFederalStatus(s.nonFederalReviewStatus || "pending");
        setCertFile(null);
        setCertPreviewUrl(s.certificateUrl ? toAbsoluteAssetUrl(s.certificateUrl) : "");

        // Load admission form data from /verification page
        const savedFormData = localStorage.getItem(`admissionForm_${s.tokenNumber}`);
        if (savedFormData) {
            try {
                const parsed = JSON.parse(savedFormData);
                console.log("Loaded admission form data:", parsed);
                setAdmissionFormData(parsed);
                
                // Populate form fields from admission form data
                if (parsed.wafaqRollNo) setRollNo(parsed.wafaqRollNo);
                if (parsed.previousClass || parsed.lastGrade) setPrevClass(parsed.previousClass || parsed.lastGrade);
                if (parsed.schoolName) setPrevMadrasa(parsed.schoolName);
                if (parsed.contact1) setMadrasaContact(parsed.contact1);
                
                toast.success("داخلہ فارم کی تفصیلات لوڈ ہو گئیں");
            } catch (e) {
                console.error("Error parsing admission form data:", e);
                setAdmissionFormData(null);
            }
        } else {
            setAdmissionFormData(null);
        }
    };

    const closePanel = () => {
        setSelectedStudent(null);
        setCertFile(null);
        setCertPreviewUrl("");
        setAdmissionFormData(null);
    };

    // ── Certificate file picker ────────────────────────────────────────────────

    const handleCertPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setCertFile(f);
        if (f.type.startsWith("image/")) {
            setCertPreviewUrl(URL.createObjectURL(f));
        } else {
            setCertPreviewUrl(""); // PDF – no inline preview
        }
    };

    // ── Validation ─────────────────────────────────────────────────────────────

    const validate = (): boolean => {
        if (studentType === "Wafaq") {
            if (!rollNo.trim()) { toast.error("رول نمبر درج کریں (ضروری)"); return false; }
            if (!examYear.trim()) { toast.error("امتحانی سال درج کریں (ضروری)"); return false; }
        } else {
            if (!prevMadrasa.trim()) { toast.error("پچھلے مدرسے کا نام درج کریں (ضروری)"); return false; }
            // Certificate required only if none uploaded before
            if (!certFile && !certPreviewUrl) {
                toast.error("سرٹیفکیٹ اپلوڈ کریں (ضروری)");
                return false;
            }
        }
        return true;
    };

    // ── Save ───────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!selectedStudent) return;
        if (!validate()) return;

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("studentType", studentType);

            if (studentType === "Wafaq") {
                fd.append("wafaqRollNo", rollNo);
                fd.append("wafaqExamYear", examYear);
                fd.append("previousClass", prevClass);
                fd.append("federalVerificationStatus", federalStatus);
            } else {
                fd.append("previousMadrasa", prevMadrasa);
                fd.append("madrasaContact", madrasaContact);
                fd.append("nonFederalReviewStatus", nonFederalStatus);
                if (certFile) fd.append("certificate", certFile);
            }

            const res = await studentsAPI.updateVerification(selectedStudent._id, fd);
            const updated = res.data.data as StudentRow;

            // Refresh local list
            setStudents((prev) =>
                prev.map((s) => (s._id === updated._id ? { ...s, ...updated } : s))
            );
            setSelectedStudent({ ...selectedStudent, ...updated });

            // Update certificate preview if a new URL came back
            if (updated.certificateUrl) {
                setCertPreviewUrl(toAbsoluteAssetUrl(updated.certificateUrl));
                setCertFile(null);
            }

            toast.success("معلومات کامیابی سے محفوظ ہو گئیں");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "محفوظ نہیں ہو سکا");
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <DashboardLayout title="کاؤنٹر 2 – تصدیق">
            <PageHeader
                title="کاؤنٹر 2 – تصدیق"
                description="طلباء کی وفاقی یا غیر وفاقی تصدیق کریں اور معلومات محفوظ کریں"
            />

            {/* Search & Filter Bar */}
            <Card className="mb-6">
                <CardContent className="pt-5">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="نام، ٹوکن نمبر یا والد کا نام..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full sm:w-52">
                                <SelectValue placeholder="تعلیمی حیثیت" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">تمام طلباء</SelectItem>
                                <SelectItem value="Wafaq">وفاقی (Federal)</SelectItem>
                                <SelectItem value="Non-Wafaq">غیر وفاقی (Non-Federal)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* ── Student List ────────────────────────────────────────────────── */}
                <div className="xl:col-span-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                طلباء کی فہرست
                                {loading && (
                                    <span className="mr-2 text-xs font-normal text-muted-foreground">
                                        لوڈ ہو رہا ہے...
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {students.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground text-sm">
                                    {loading ? "براہ کرم انتظار کریں..." : "کوئی طالب علم نہیں ملا"}
                                </div>
                            ) : (
                                <ul className="divide-y">
                                    {students.map((s) => (
                                        <li
                                            key={s._id}
                                            onClick={() => openStudent(s)}
                                            className={`px-4 py-3 cursor-pointer transition-colors hover:bg-muted/60 ${selectedStudent?._id === s._id ? "bg-primary/5 border-r-2 border-primary" : ""
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">{s.studentName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {s.tokenNumber} • {s.class}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <CategoryBadge category={s.category} />
                                                </div>
                                            </div>
                                            <div className="mt-1.5">
                                                {s.category === "Wafaq" ? (
                                                    <FederalStatusBadge status={s.federalVerificationStatus} />
                                                ) : (
                                                    <NonFederalStatusBadge status={s.nonFederalReviewStatus} />
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Detail Panel ─────────────────────────────────────────────────── */}
                <div className="xl:col-span-3">
                    {!selectedStudent ? (
                        <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground text-sm">
                            <div className="text-center space-y-2">
                                <ShieldCheck className="h-10 w-10 mx-auto opacity-25" />
                                <p>بائیں طرف سے کوئی طالب علم منتخب کریں</p>
                            </div>
                        </div>
                    ) : (
                        <Card className="border-primary/30">
                            <CardHeader className="flex flex-row items-start justify-between pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base">{selectedStudent.studentName}</CardTitle>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {selectedStudent.tokenNumber} • والد: {selectedStudent.fatherName}
                                    </p>
                                </div>
                                <Button size="icon" variant="ghost" onClick={closePanel}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-5">

                                {/* Student Type */}
                                <div className="space-y-1.5">
                                    <Label>تعلیمی حیثیت <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={studentType}
                                        onValueChange={(v) => setStudentType(v as "Wafaq" | "Non-Wafaq")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Wafaq">وفاقی (Federal – Wafaq)</SelectItem>
                                            <SelectItem value="Non-Wafaq">غیر وفاقی (Non-Federal – Non-Wafaq)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* ── Federal Fields ────────────────────────────────────── */}
                                {studentType === "Wafaq" && (
                                    <div className="space-y-4 rounded-lg border bg-blue-50/40 dark:bg-blue-950/10 p-4">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            وفاق المدارس العربیہ – Federal Verification
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Roll Number */}
                                            <div className="space-y-1.5">
                                                <Label>
                                                    رول نمبر <span className="text-destructive">*</span>
                                                </Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="وفاقی رول نمبر"
                                                        value={rollNo}
                                                        onChange={(e) => setRollNo(e.target.value)}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(rollNo);
                                                            toast.success("رول نمبر کاپی ہو گیا");
                                                        }}
                                                        disabled={!rollNo}
                                                        title="کاپی کریں"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Exam Year */}
                                            <div className="space-y-1.5">
                                                <Label>
                                                    امتحانی سال <span className="text-destructive">*</span>
                                                </Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="مثلاً 2024"
                                                        value={examYear}
                                                        onChange={(e) => setExamYear(e.target.value)}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(examYear);
                                                            toast.success("امتحانی سال کاپی ہو گیا");
                                                        }}
                                                        disabled={!examYear}
                                                        title="کاپی کریں"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Previous Class */}
                                            <div className="space-y-1.5">
                                                <Label>پچھلا درجہ</Label>
                                                <Input
                                                    placeholder="مثلاً تجوید"
                                                    value={prevClass}
                                                    onChange={(e) => setPrevClass(e.target.value)}
                                                />
                                            </div>

                                            {/* Verify Button */}
                                            <div className="space-y-1.5">
                                                <Label className="invisible">verify</Label>
                                                <Button
                                                    variant="outline"
                                                    className="w-full gap-2"
                                                    onClick={() => {
                                                        if (isElectron) {
                                                            setShowWafaqIframe(true);
                                                        } else {
                                                            window.open(
                                                                "https://www.wifaqulmadaris.org/Results/Infradi",
                                                                "_blank",
                                                                "noopener"
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    وفاقی ویب سائٹ چیک کریں
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Wafaq Website Iframe Modal */}
                                        {showWafaqIframe && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                                <div className="relative h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
                                                    <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
                                                        <h3 className="font-bold text-gray-700">وفاق المدارس العربیہ - رزلٹ پورٹل</h3>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setShowWafaqIframe(false)}
                                                            className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                                        >
                                                            <X className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                    <div className="h-full w-full bg-white flex flex-col items-center justify-center">
                                                        {isElectron ? (
                                                            <webview
                                                                src="https://www.wifaqulmadaris.org/Results/Infradi"
                                                                className="h-full w-full border-0"
                                                                style={{ height: '100%', width: '100%' }}
                                                                title="Wafaq Results"
                                                            />
                                                        ) : (
                                                            <div className="text-center p-8 space-y-4">
                                                                <ExternalLink className="h-16 w-16 mx-auto text-blue-500 opacity-50" />
                                                                <h2 className="text-xl font-bold">براؤزر میں براہِ راست لوڈنگ ممکن نہیں</h2>
                                                                <p className="text-muted-foreground max-w-md mx-auto">
                                                                    وفاقی ویب سائٹ سیکیورٹی کی وجہ سے براؤزر کے اندر لوڈ نہیں ہو سکتی۔ مکمل تجربے کے لیے <b>جامعہ سافٹ ویئر</b> استعمال کریں یا نیچے والے بٹن پر کلک کریں۔
                                                                </p>
                                                                <Button 
                                                                    size="lg" 
                                                                    className="gap-2"
                                                                    onClick={() => window.open("https://www.wifaqulmadaris.org/Results/Infradi", "_blank")}
                                                                >
                                                                    <ExternalLink className="h-5 w-5" />
                                                                    ویب سائٹ نئی ٹیب میں کھولیں
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Verification Status */}
                                        <div className="space-y-1.5">
                                            <Label>تصدیق کی حالت</Label>
                                            <Select value={federalStatus} onValueChange={setFederalStatus}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">زیرِ التواء (Pending)</SelectItem>
                                                    <SelectItem value="eligible">اہل (Eligible)</SelectItem>
                                                    <SelectItem value="not_eligible">غیر اہل (Not Eligible)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Info badges */}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <FederalStatusBadge status={federalStatus} />
                                            {selectedStudent.verifiedBy && (
                                                <Badge variant="outline" className="text-xs">
                                                    تصدیق کنندہ: {selectedStudent.verifiedBy.name}
                                                </Badge>
                                            )}
                                            {selectedStudent.verifiedAt && (
                                                <Badge variant="outline" className="text-xs">
                                                    تاریخ تصدیق: {fmtDate(selectedStudent.verifiedAt)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Non-Federal Fields ───────────────────────────────── */}
                                {studentType === "Non-Wafaq" && (
                                    <div className="space-y-4 rounded-lg border bg-purple-50/40 dark:bg-purple-950/10 p-4">
                                        <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                                            غیر وفاقی سند – Non-Federal Review
                                        </p>

                                        <div className="space-y-4">
                                            {/* Previous Madrasa */}
                                            <div className="space-y-1.5">
                                                <Label>
                                                    پچھلے مدرسے کا نام <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    placeholder="مدرسے کا نام"
                                                    value={prevMadrasa}
                                                    onChange={(e) => setPrevMadrasa(e.target.value)}
                                                />
                                            </div>

                                            {/* Madrasa Contact */}
                                            <div className="space-y-1.5">
                                                <Label>مدرسے کا رابطہ نمبر</Label>
                                                <div className="flex justify-end">
                                                    <PhoneInput
                                                        value={madrasaContact}
                                                        onChange={(v) => setMadrasaContact(v)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Certificate Upload */}
                                        <div className="space-y-2">
                                            <Label>
                                                سرٹیفکیٹ اپلوڈ کریں (PDF / تصویر){" "}
                                                <span className="text-destructive">*</span>
                                            </Label>

                                            {certPreviewUrl ? (
                                                <div className="relative inline-block">
                                                    {certFile?.type?.startsWith("image/") ||
                                                        (!certFile && certPreviewUrl && !certPreviewUrl.endsWith(".pdf")) ? (
                                                        <img
                                                            src={certPreviewUrl}
                                                            alt="certificate preview"
                                                            className="h-28 rounded border object-contain bg-muted"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-2 rounded border px-4 py-3 bg-muted text-sm">
                                                            <Upload className="h-4 w-4 text-muted-foreground" />
                                                            {certFile ? certFile.name : "سرٹیفکیٹ ملف اپلوڈ ہو چکی ہے"}
                                                            {certPreviewUrl && !certFile && (
                                                                <a
                                                                    href={certPreviewUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary underline text-xs mr-2"
                                                                >
                                                                    دیکھیں
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        className="absolute -top-2 -right-2 h-6 w-6"
                                                        onClick={() => {
                                                            setCertFile(null);
                                                            setCertPreviewUrl("");
                                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/30 rounded-lg py-8 cursor-pointer hover:border-primary/50 transition-colors"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="h-8 w-8 text-muted-foreground/50" />
                                                    <p className="text-sm text-muted-foreground">
                                                        PDF یا تصویر یہاں کلک کر کے منتخب کریں
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/60">
                                                        (JPEG, PNG, PDF – زیادہ سے زیادہ 10MB)
                                                    </p>
                                                </div>
                                            )}

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                onChange={handleCertPick}
                                            />
                                        </div>

                                        {/* Review Status */}
                                        <div className="space-y-1.5">
                                            <Label>جائزہ کی حالت</Label>
                                            <Select value={nonFederalStatus} onValueChange={setNonFederalStatus}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">زیرِ التواء (Pending)</SelectItem>
                                                    <SelectItem value="approved">منظور (Approved)</SelectItem>
                                                    <SelectItem value="rejected">مسترد (Rejected)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Info badges */}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <NonFederalStatusBadge status={nonFederalStatus} />
                                            {selectedStudent.nonFederalReviewedBy && (
                                                <Badge variant="outline" className="text-xs">
                                                    جائزہ کنندہ: {selectedStudent.nonFederalReviewedBy.name}
                                                </Badge>
                                            )}
                                            {selectedStudent.nonFederalReviewedAt && (
                                                <Badge variant="outline" className="text-xs">
                                                    تاریخ جائزہ: {fmtDate(selectedStudent.nonFederalReviewedAt)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Admission Form Data from /verification ───────────────── */}
                                {admissionFormData && (
                                    <div className="space-y-3 rounded-lg border bg-green-50/40 dark:bg-green-950/10 p-4">
                                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            داخلہ فارم کی معلومات (ورڈ سے)
                                        </p>
                                        
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {admissionFormData.name && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">نام:</span>
                                                    <span className="font-semibold">{admissionFormData.name}</span>
                                                </div>
                                            )}
                                            {admissionFormData.fatherName && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">والد:</span>
                                                    <span className="font-semibold">{admissionFormData.fatherName}</span>
                                                </div>
                                            )}
                                            {admissionFormData.dob && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">پیدائش:</span>
                                                    <span className="font-semibold">{admissionFormData.dob}</span>
                                                </div>
                                            )}
                                            {admissionFormData.phone && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">فون:</span>
                                                    <span className="font-semibold" dir="ltr">{admissionFormData.phone}</span>
                                                </div>
                                            )}
                                            {admissionFormData.cnic && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">شناختی کارڈ:</span>
                                                    <span className="font-semibold" dir="ltr">{admissionFormData.cnic}</span>
                                                </div>
                                            )}
                                            {admissionFormData.desiredGrade && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">مطلوبہ درجہ:</span>
                                                    <span className="font-semibold">{admissionFormData.desiredGrade}</span>
                                                </div>
                                            )}
                                            {admissionFormData.lastGrade && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">آخری پاس کردہ درجہ:</span>
                                                    <span className="font-semibold">{admissionFormData.lastGrade}</span>
                                                </div>
                                            )}
                                            {admissionFormData.schoolName && (
                                                <div className="flex justify-between col-span-2">
                                                    <span className="text-gray-600">سابقہ مدرسہ:</span>
                                                    <span className="font-semibold">{admissionFormData.schoolName}</span>
                                                </div>
                                            )}
                                            {admissionFormData.currentAddress && (
                                                <div className="flex justify-between col-span-2">
                                                    <span className="text-gray-600">موجودہ پتہ:</span>
                                                    <span className="font-semibold">{admissionFormData.currentAddress}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Save Button */}
                                <div className="pt-2">
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? "محفوظ ہو رہا ہے..." : "محفوظ کریں / اپ ڈیٹ کریں"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
