import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdmissionFormProps {
    admissionNumber: string;
    tokenNumber: string;
    studentName: string;
    fatherName: string;
    grade: string;
    studentType: string;
    previousMadrasa?: string;
    previousClass?: string;
    wafaqRollNo?: string;
    photoUrl?: string;
    admissionDate: string;
}

export function AdmissionForm({
    admissionNumber,
    tokenNumber,
    studentName,
    fatherName,
    grade,
    studentType,
    previousMadrasa,
    previousClass,
    wafaqRollNo,
    photoUrl,
    admissionDate,
}: AdmissionFormProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            {/* A4 Form Preview */}
            <div className="admission-form bg-white text-black p-10 border-2 border-black font-urdu">
                {/* Header */}
                <div className="border-b border-black pb-4 mb-4">
                    <div className="grid grid-cols-[96px_1fr_120px] items-start gap-4">
                        <div className="w-24">
                            <div className="border border-black h-28 w-24 flex items-center justify-center text-sm">
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt="Student"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>تصویر</span>
                                )}
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-[22px] font-semibold leading-tight">
                                جامعہ دارالعلوم
                            </div>
                            <div className="text-[14px] leading-tight mt-1">
                                داخلہ فارم
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                                <div className="text-right">
                                    <span className="ml-2">داخلہ نمبر:</span>
                                    <span className="font-semibold">{admissionNumber}</span>
                                </div>
                                <div className="text-right">
                                    <span className="ml-2">ٹوکن نمبر:</span>
                                    <span className="font-mono">{tokenNumber}</span>
                                </div>
                            </div>

                            <div className="mt-2 text-[12px] text-right">
                                <span className="ml-2">تاریخ:</span>
                                <span className="font-semibold">{admissionDate}</span>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <div className="h-24 w-24 rounded-full border-2 border-black flex items-center justify-center text-[11px] text-center leading-tight px-2">
                                مہر
                                <br />
                                ادارہ
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-[12px] text-right grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                            <span>نامِ طالب علم:</span>
                            <span className="flex-1 border-b border-black min-h-[16px]">{studentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>ولدیت:</span>
                            <span className="flex-1 border-b border-black min-h-[16px]">{fatherName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>درجہ:</span>
                            <span className="flex-1 border-b border-black min-h-[16px]">{grade}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>تعلیمی حیثیت:</span>
                            <span className="flex-1 border-b border-black min-h-[16px]">{studentType}</span>
                        </div>
                    </div>
                </div>

                {/* Student Information */}
                <div className="mb-4">
                    <div className="text-[12px] text-right grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                            <span>سابقہ مدرسہ:</span>
                            <span className="flex-1 border-b border-black min-h-[16px]">
                                {previousMadrasa || ""}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>سابقہ درجہ:</span>
                            <span className="flex-1 border-b border-black min-h-[16px]">
                                {previousClass || ""}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>وفاقی رول نمبر:</span>
                            <span className="flex-1 border-b border-black min-h-[16px]">
                                {wafaqRollNo || ""}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>اضافی نوٹ:</span>
                            <span className="flex-1 border-b border-black min-h-[16px]" />
                        </div>
                    </div>
                </div>

                {/* Previous Education */}
                <div className="mb-4">
                    <div className="border border-black p-3">
                        <div className="text-[13px] font-semibold text-center mb-2">
                            عہد نامہ / ہدایات
                        </div>
                        <ol className="text-[11px] leading-relaxed space-y-1 pr-5 list-decimal">
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
                </div>

                {/* Signatures */}
                <div className="mt-6 pt-4 border-t border-black">
                    <div className="grid grid-cols-3 gap-6 text-[12px]">
                        <div className="text-right">
                            <div className="border-b border-black h-10" />
                            <div className="mt-1">دستخطِ طالب علم</div>
                        </div>
                        <div className="text-right">
                            <div className="border-b border-black h-10" />
                            <div className="mt-1">دستخطِ ولی/سرپرست</div>
                        </div>
                        <div className="text-right">
                            <div className="border-b border-black h-10" />
                            <div className="mt-1">دستخطِ منتظم</div>
                        </div>
                    </div>

                    <div className="mt-5 border border-black p-3">
                        <div className="text-center text-[13px] font-semibold mb-2">صرف دفتر کے استعمال کیلئے</div>
                        <div className="grid grid-cols-2 gap-4 text-[12px]">
                            <div className="flex items-center gap-2">
                                <span>داخلہ منظور:</span>
                                <span className="flex-1 border-b border-black min-h-[16px]" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span>دستخط:</span>
                                <span className="flex-1 border-b border-black min-h-[16px]" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span>رقم وصولی:</span>
                                <span className="flex-1 border-b border-black min-h-[16px]" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span>تاریخ:</span>
                                <span className="flex-1 border-b border-black min-h-[16px]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Button */}
            <Button onClick={handlePrint} className="w-full" size="lg">
                <Printer className="h-4 w-4 ml-2" />
                A4 فارم پرنٹ کریں
            </Button>

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
          .admission-form {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            padding: 20mm;
            border: none;
          }
        }
      `}</style>
        </div>
    );
}
