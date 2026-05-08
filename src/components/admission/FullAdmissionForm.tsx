import { useState, useEffect } from "react";
import { Printer, Save, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CNICInput, PhoneInput, DateBoxInput, CharacterBoxInput } from "./CharacterBoxInputs";

interface FullAdmissionFormProps {
    studentData?: any;
    onSubmit?: (data: any, action: 'verify' | 'reject') => void;
    onClose?: () => void;
}

export function FullAdmissionForm({
    studentData,
    onSubmit,
    onClose,
}: FullAdmissionFormProps) {
    const [loading, setLoading] = useState(false);
    const [showBackPage, setShowBackPage] = useState(false);

    // Form state - matching exact hardcopy fields
    const [formData, setFormData] = useState({
        // Token Info
        tokenNumber: "",
        admissionDate: (() => {
          try {
            return new Date().toLocaleDateString('en-CA');
          } catch (e) {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          }
        })(),

        // Personal Information (Front Page)
        studentName: "",
        fatherName: "",
        dateOfBirth: "",
        age: "",
        currentAddress: "",
        permanentAddress: "",
        cnic: "",
        contact: "",
        class: "",
        category: "Wafaq",
        photoUrl: "",

        // Guardian Information
        guardianName: "",
        guardianRelation: "والد",
        guardianCNIC: "",
        guardianContact: "",
        guardianProfession: "",
        guardianAddress: "",

        // Academic Background
        previousMadrasa: "",
        previousClass: "",
        previousEducation: "",
        lastExamResult: "",
        performance: "",
        wafaqRollNo: "",
        hafizStatus: "",
        islamicEducationYears: "",

        // Physical & Medical
        bloodGroup: "",
        medicalConditions: "",
        emergencyContact: "",

        // Declaration
        declarationAccepted: false,

        // Notes
        notes: "",

        // Office Use
        feeReceived: "",
        approvalRemarks: "",
    });

    // Auto-fill form when student data is provided
    useEffect(() => {
        if (studentData) {
            setFormData(prev => ({
                ...prev,
                tokenNumber: studentData.tokenNumber || "",
                studentName: studentData.studentName || "",
                fatherName: studentData.fatherName || "",
                dateOfBirth: studentData.dateOfBirth || "",
                age: studentData.age || "",
                currentAddress: studentData.currentAddress || "",
                permanentAddress: studentData.permanentAddress || "",
                cnic: studentData.cnic || "",
                contact: studentData.contact || "",
                class: studentData.class || "",
                category: studentData.category || "Wafaq",
                photoUrl: studentData.photoUrl || "",
                guardianName: studentData.guardianName || studentData.fatherName || "",
                guardianCNIC: studentData.guardianCNIC || "",
                guardianContact: studentData.guardianContact || studentData.contact || "",
                guardianProfession: studentData.guardianProfession || "",
                guardianAddress: studentData.guardianAddress || studentData.currentAddress || "",
                previousMadrasa: studentData.previousMadrasa || "",
                previousClass: studentData.previousClass || "",
                previousEducation: studentData.previousEducation || "",
                lastExamResult: studentData.lastExamResult || "",
                performance: studentData.performance || "",
                wafaqRollNo: studentData.wafaqRollNo || "",
                hafizStatus: studentData.hafizStatus || "",
                islamicEducationYears: studentData.islamicEducationYears || "",
                bloodGroup: studentData.bloodGroup || "",
                medicalConditions: studentData.medicalConditions || "",
                emergencyContact: studentData.emergencyContact || "",
                notes: studentData.notes || "",
            }));
        }
    }, [studentData]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const sanitizePayload = (data: any) => {
        const next = { ...data };
        const emptyToUndefined = (key: string) => {
            if (typeof next[key] === "string" && next[key].trim() === "") {
                next[key] = undefined;
            }
        };

        emptyToUndefined("performance");
        emptyToUndefined("hafizStatus");
        emptyToUndefined("category");
        emptyToUndefined("guardianRelation");

        return next;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSave = async () => {
        if (!formData.declarationAccepted) {
            toast.error("براہ کرم عہد نامہ کو قبول کریں");
            return;
        }

        setLoading(true);
        try {
            if (onSubmit) {
                await onSubmit(sanitizePayload(formData), 'verify');
            }
            toast.success("فارم کامیابی سے محفوظ ہو گیا");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "خرابی پیش آئی");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!formData.declarationAccepted) {
            toast.error("براہ کرم عہد نامہ کو قبول کریں");
            return;
        }

        setLoading(true);
        try {
            if (onSubmit) {
                await onSubmit(sanitizePayload({ ...formData, status: 'verified' }), 'verify');
            }
            toast.success("داخلہ منظور ہو گیا");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "خرابی پیش آئی");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        const reason = prompt("مسترد کرنے کی وجہ درج کریں:");
        if (!reason) return;

        setLoading(true);
        try {
            if (onSubmit) {
                await onSubmit(
                    sanitizePayload({ ...formData, status: 'rejected', rejectionReason: reason }),
                    'reject'
                );
            }
            toast.success("داخلہ مسترد کر دیا گیا");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "خرابی پیش آئی");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-0 print:space-y-0">
            {/* Action Buttons - Hidden in print */}
            <div className="no-print flex gap-2 justify-between items-center bg-muted p-4 rounded-lg">
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowBackPage(!showBackPage)}
                        variant="outline"
                    >
                        {showBackPage ? "صفحہ اول" : "صفحہ دوم"}
                    </Button>
                    <Button onClick={handlePrint} variant="outline">
                        <Printer className="h-4 w-4 ml-2" />
                        پرنٹ کریں
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        variant="secondary"
                    >
                        {loading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                        محفوظ کریں
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        منظور کریں
                    </Button>
                    <Button
                        onClick={handleReject}
                        disabled={loading}
                        variant="destructive"
                    >
                        <XCircle className="h-4 w-4 ml-2" />
                        مسترد کریں
                    </Button>
                </div>
            </div>

            {/* Front Page */}
            {!showBackPage && (
                <div className="admission-form bg-white p-4 print:p-2 border-4 border-black" dir="rtl">
                    {/* Header with Photo and Seal */}
                    <div className="flex items-start justify-between mb-6 pb-4 border-b-4 border-black">
                        {/* Photo */}
                        <div className="w-28 h-32 border-4 border-black flex items-center justify-center bg-gray-50">
                            {formData.photoUrl ? (
                                <img
                                    src={formData.photoUrl}
                                    alt="Student"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-xs text-center font-bold">تصویر<br />2×2</span>
                            )}
                        </div>

                        {/* Title */}
                        <div className="flex-1 text-center px-4">
                            <h1 className="text-2xl font-bold mb-2">جامعہ دارالعلوم اسلامیہ مرکزیہ (رجسٹرڈ)</h1>
                            <p className="text-base mb-3">مقام: پاکستان</p>
                            <div className="border-4 border-black py-2 px-6 inline-block bg-gray-800 text-white">
                                <h2 className="text-xl font-bold">داخلہ فارم</h2>
                            </div>
                        </div>

                        {/* Seal */}
                        <div className="w-24 h-24 rounded-full border-4 border-black flex items-center justify-center bg-gray-50">
                            <span className="text-xs text-center font-bold">مہر<br />ادارہ</span>
                        </div>
                    </div>

                    {/* Form Fields - Exact Layout with Character Boxes */}
                    <div className="space-y-4">
                        {/* Row 1: Name and Father Name */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">نام:</span>
                                <Input
                                    value={formData.studentName}
                                    onChange={(e) => handleInputChange('studentName', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black font-bold"
                                    dir="rtl"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">ولدیت:</span>
                                <Input
                                    value={formData.fatherName}
                                    onChange={(e) => handleInputChange('fatherName', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black font-bold"
                                    dir="rtl"
                                />
                            </div>
                        </div>

                        {/* Row 2: DOB, Age, Class */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                                <span className="font-bold whitespace-nowrap text-sm">تاریخ پیدائش:</span>
                                <DateBoxInput
                                    value={formData.dateOfBirth}
                                    onChange={(v) => handleInputChange('dateOfBirth', v)}
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold whitespace-nowrap text-sm">عمر:</span>
                                <CharacterBoxInput
                                    value={formData.age}
                                    onChange={(v) => handleInputChange('age', v)}
                                    length={2}
                                    type="number"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold whitespace-nowrap text-sm">درجہ:</span>
                                <Input
                                    value={formData.class}
                                    onChange={(e) => handleInputChange('class', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                    dir="rtl"
                                />
                            </div>
                        </div>

                        {/* Row 3: Current Address */}
                        <div className="flex items-center gap-3">
                            <span className="font-bold whitespace-nowrap text-base">موجودہ پتہ:</span>
                            <Input
                                value={formData.currentAddress}
                                onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                                className="flex-1 h-10 border-2 border-black"
                                dir="rtl"
                            />
                        </div>

                        {/* Row 4: Permanent Address */}
                        <div className="flex items-center gap-3">
                            <span className="font-bold whitespace-nowrap text-base">مستقل پتہ:</span>
                            <Input
                                value={formData.permanentAddress}
                                onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                                className="flex-1 h-10 border-2 border-black"
                                dir="rtl"
                            />
                        </div>

                        {/* Row 5: CNIC and Contact with Character Boxes */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-sm">شناختی کارڈ:</span>
                                <CNICInput
                                    value={formData.cnic}
                                    onChange={(v) => handleInputChange('cnic', v)}
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-sm">رابطہ:</span>
                                <PhoneInput
                                    value={formData.contact}
                                    onChange={(v) => handleInputChange('contact', v)}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Section Header */}
                        <div className="border-4 border-black bg-gray-800 text-white text-center py-2 mt-6 mb-4">
                            <h3 className="font-bold text-lg">تعلیمی معلومات</h3>
                        </div>

                        {/* Row 6: Previous Madrasa and Class */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">سابقہ مدرسہ:</span>
                                <Input
                                    value={formData.previousMadrasa}
                                    onChange={(e) => handleInputChange('previousMadrasa', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                    dir="rtl"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">سابقہ درجہ:</span>
                                <Input
                                    value={formData.previousClass}
                                    onChange={(e) => handleInputChange('previousClass', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                    dir="rtl"
                                />
                            </div>
                        </div>

                        {/* Row 7: Performance and Wafaq Roll No */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">کارکردگی:</span>
                                <Input
                                    value={formData.performance}
                                    onChange={(e) => handleInputChange('performance', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                    dir="rtl"
                                    placeholder="ممتاز/اچھا/درمیانہ"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">وفاقی رول نمبر:</span>
                                <Input
                                    value={formData.wafaqRollNo}
                                    onChange={(e) => handleInputChange('wafaqRollNo', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                />
                            </div>
                        </div>

                        {/* Row 8: Hafiz Status and Islamic Education Years */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">حفظ کی حیثیت:</span>
                                <Input
                                    value={formData.hafizStatus}
                                    onChange={(e) => handleInputChange('hafizStatus', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                    dir="rtl"
                                    placeholder="مکمل/ناظرہ/جاری"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">دینی تعلیم (سال):</span>
                                <CharacterBoxInput
                                    value={formData.islamicEducationYears}
                                    onChange={(v) => handleInputChange('islamicEducationYears', v)}
                                    length={2}
                                    type="number"
                                />
                            </div>
                        </div>

                        {/* Section Header */}
                        <div className="border-4 border-black bg-gray-800 text-white text-center py-2 mt-6 mb-4">
                            <h3 className="font-bold text-lg">سرپرست کی معلومات</h3>
                        </div>

                        {/* Row 9: Guardian Name and Relation */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">نام:</span>
                                <Input
                                    value={formData.guardianName}
                                    onChange={(e) => handleInputChange('guardianName', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                    dir="rtl"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">تعلق:</span>
                                <Input
                                    value={formData.guardianRelation}
                                    onChange={(e) => handleInputChange('guardianRelation', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                    dir="rtl"
                                    placeholder="والد/بھائی/چچا"
                                />
                            </div>
                        </div>

                        {/* Row 10: Guardian CNIC and Contact */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-sm">شناختی کارڈ:</span>
                                <CNICInput
                                    value={formData.guardianCNIC}
                                    onChange={(v) => handleInputChange('guardianCNIC', v)}
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-sm">رابطہ:</span>
                                <PhoneInput
                                    value={formData.guardianContact}
                                    onChange={(v) => handleInputChange('guardianContact', v)}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Row 11: Profession and Blood Group */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">پیشہ:</span>
                                <Input
                                    value={formData.guardianProfession}
                                    onChange={(e) => handleInputChange('guardianProfession', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                    dir="rtl"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">بلڈ گروپ:</span>
                                <Input
                                    value={formData.bloodGroup}
                                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                    placeholder="A+, B+, O+, AB+"
                                />
                            </div>
                        </div>

                        {/* Row 12: Guardian Address */}
                        <div className="flex items-center gap-3">
                            <span className="font-bold whitespace-nowrap text-base">پتہ:</span>
                            <Input
                                value={formData.guardianAddress}
                                onChange={(e) => handleInputChange('guardianAddress', e.target.value)}
                                className="flex-1 h-10 border-2 border-black"
                                dir="rtl"
                            />
                        </div>

                        {/* Row 13: Emergency Contact */}
                        <div className="flex items-center gap-3">
                            <span className="font-bold whitespace-nowrap text-base">ایمرجنسی رابطہ:</span>
                            <PhoneInput
                                value={formData.emergencyContact}
                                onChange={(v) => handleInputChange('emergencyContact', v)}
                                className="flex-1"
                            />
                        </div>

                        {/* Row 14: Medical Conditions */}
                        <div className="flex items-start gap-3">
                            <span className="font-bold whitespace-nowrap mt-2 text-base">طبی معلومات:</span>
                            <Textarea
                                value={formData.medicalConditions}
                                onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                                className="flex-1 border-2 border-black min-h-[80px]"
                                dir="rtl"
                                placeholder="کوئی خاص بیماری یا الرجی"
                            />
                        </div>

                        {/* Row 15: Notes */}
                        <div className="flex items-start gap-3">
                            <span className="font-bold whitespace-nowrap mt-2 text-base">نوٹس:</span>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                className="flex-1 border-2 border-black min-h-[80px]"
                                dir="rtl"
                                placeholder="کوئی اضافی معلومات"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Back Page */}
            {showBackPage && (
                <div className="admission-form bg-white p-8 border-4 border-black" dir="rtl">
                    {/* Header */}
                    <div className="text-center mb-6 pb-4 border-b-4 border-black">
                        <h1 className="text-2xl font-bold mb-2">جامعہ دارالعلوم اسلامیہ مرکزیہ (رجسٹرڈ)</h1>
                        <p className="text-base mb-3">مقام: پاکستان</p>
                        <div className="border-4 border-black py-2 px-6 inline-block bg-gray-800 text-white">
                            <h2 className="text-xl font-bold">داخلہ فارم</h2>
                        </div>
                        <p className="text-sm mt-3 font-bold">(برائے دفتر کے استعمال کیلئے)</p>
                    </div>

                    {/* Declaration Section */}
                    <div className="mb-6">
                        <div className="border-4 border-black bg-gray-800 text-white text-center py-2 mb-4">
                            <h3 className="font-bold text-lg">عہد نامہ اور ہدایات</h3>
                        </div>
                        <div className="border-4 border-black p-6 leading-relaxed">
                            <ol className="list-decimal pr-6 space-y-2 text-base">
                                <li>میں اس امر کی تصدیق کرتا ہوں کہ تمام درج معلومات درست ہیں۔</li>
                                <li>ادارہ کے تمام قواعد و ضوابط کی مکمل پابندی کروں گا۔</li>
                                <li>نماز باجماعت اور دینی آداب کی پابندی لازم ہوگی۔</li>
                                <li>بلا اجازت غیر حاضری کی صورت میں ادارہ کارروائی کا مجاز ہوگا۔</li>
                                <li>امتحانات میں شرکت اور ادارہ کی ہدایات کے مطابق تیاری کروں گا۔</li>
                                <li>اساتذہ و منتظمین کا احترام اور حسنِ اخلاق کا مظاہرہ کروں گا۔</li>
                                <li>ادارہ کی املاک کو نقصان نہیں پہنچاؤں گا۔</li>
                                <li>غیر ضروری موبائل/آلات کا استعمال ممنوع ہوگا۔</li>
                                <li>وقت کی پابندی اور حاضری کی مکمل کوشش کروں گا۔</li>
                                <li>فیس/اخراجات کی ادائیگی مقررہ وقت پر کروں گا۔</li>
                                <li>کسی بھی خلاف ورزی پر داخلہ منسوخ کیا جا سکتا ہے۔</li>
                                <li>ادارہ کی جانب سے دی گئی ذمہ داری کو احسن طریقہ سے نبھاؤں گا۔</li>
                                <li>طالب علم کی صحت/حفاظت کے متعلق معلومات بروقت فراہم کروں گا۔</li>
                                <li>جھوٹی معلومات کی صورت میں ادارہ داخلہ منسوخ کر سکتا ہے۔</li>
                                <li>میں اس عہد نامہ پر مکمل رضامندی سے دستخط کرتا ہوں۔</li>
                            </ol>
                        </div>

                        {/* Declaration Checkbox */}
                        <div className="flex items-center gap-4 mt-6 p-4 bg-yellow-50 border-4 border-yellow-400 rounded">
                            <Checkbox
                                id="declaration"
                                checked={formData.declarationAccepted}
                                onCheckedChange={(checked) => handleInputChange('declarationAccepted', checked)}
                                className="w-6 h-6"
                            />
                            <Label htmlFor="declaration" className="text-base font-bold cursor-pointer">
                                میں مندرجہ بالا تمام شرائط کو قبول کرتا/کرتی ہوں
                            </Label>
                        </div>
                    </div>

                    {/* Signatures Section */}
                    <div className="mb-6">
                        <div className="border-4 border-black bg-gray-800 text-white text-center py-2 mb-4">
                            <h3 className="font-bold text-lg">دستخط</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="border-b-4 border-black h-20 mb-3"></div>
                                <p className="font-bold text-base">دستخطِ طالب علم</p>
                                <p className="text-sm text-gray-600 mt-1">Student Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b-4 border-black h-20 mb-3"></div>
                                <p className="font-bold text-base">دستخطِ ولی/سرپرست</p>
                                <p className="text-sm text-gray-600 mt-1">Guardian Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b-4 border-black h-20 mb-3"></div>
                                <p className="font-bold text-base">دستخطِ منتظم</p>
                                <p className="text-sm text-gray-600 mt-1">Administrator Signature</p>
                            </div>
                        </div>
                    </div>

                    {/* Office Use Only */}
                    <div className="border-4 border-black p-6">
                        <div className="border-4 border-black bg-red-600 text-white text-center py-2 mb-4">
                            <h3 className="font-bold text-lg">صرف دفتر کے استعمال کیلئے</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">داخلہ منظور:</span>
                                <div className="flex-1 border-b-4 border-black h-10"></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">تاریخ:</span>
                                <div className="flex-1 border-b-4 border-black h-10"></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">رقم وصولی:</span>
                                <Input
                                    type="number"
                                    value={formData.feeReceived}
                                    onChange={(e) => handleInputChange('feeReceived', e.target.value)}
                                    className="flex-1 h-10 border-2 border-black"
                                    placeholder="روپے"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold whitespace-nowrap text-base">دستخط:</span>
                                <div className="flex-1 border-b-4 border-black h-10"></div>
                            </div>
                            <div className="col-span-2 flex items-start gap-3">
                                <span className="font-bold whitespace-nowrap mt-2 text-base">تبصرہ:</span>
                                <Textarea
                                    value={formData.approvalRemarks}
                                    onChange={(e) => handleInputChange('approvalRemarks', e.target.value)}
                                    className="flex-1 border-2 border-black min-h-[80px]"
                                    dir="rtl"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .admission-form,
                    .admission-form * {
                        visibility: visible;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .admission-form {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        min-height: 297mm;
                        padding: 15mm;
                        border: none;
                        page-break-after: always;
                    }
                    input, textarea {
                        border: none !important;
                        border-bottom: 2px solid black !important;
                        background: transparent !important;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}
