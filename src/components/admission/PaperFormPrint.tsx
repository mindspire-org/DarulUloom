import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaperFormPrintProps {
    data: any;
    printPage?: "front" | "back" | "both";
}

export function PaperFormPrint({ data, printPage = "both" }: PaperFormPrintProps) {
    const handlePrint = () => {
        window.print();
    };

    const v = (val: any) => (val === null || val === undefined ? "" : String(val));

    // Helper to create digit boxes (smaller size)
    const boxes = (val: any, len: number) => {
        const s = v(val).replace(/[-\s]/g, '').slice(0, len);
        const arr = s.split("");
        while (arr.length < len) arr.push("");
        return (
            <div className="flex flex-row gap-0.5" dir="ltr">
                {arr.map((ch, i) => (
                    <div key={i} className="h-5 w-4 border border-black text-center text-xs leading-5 font-mono">
                        {ch}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="paper-print">
                <div className="paper-page bg-white text-black font-urdu" dir="rtl">
                    
                    {/* Header Section */}
                    <div className="border-2 border-black p-2 mb-3">
                        <div className="flex items-center justify-between">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <img 
                                    src={`/logo.png?v=${Date.now()}`}
                                    alt="جامعہ دارالعلوم سرحد"
                                    className="h-20 w-20 object-contain"
                                />
                            </div>
                            
                            {/* Title */}
                            <div className="text-center flex-1">
                                <div className="text-2xl font-bold mb-1">جامعہ اسلامیہ دارالعلوم سرحد (پشاور)</div>
                                <div className="text-sm font-bold">ملحق وفاق المدارس العربیہ پاکستان</div>
                            </div>
                            
                            {/* Empty space for balance */}
                            <div className="w-20"></div>
                        </div>
                    </div>

                    {/* Admission Form Section */}
                    <div className="border-2 border-black px-2 pb-2 mb-3">
                        {/* Row 1: Title and Date */}
                        <div className="flex items-end justify-between mb-2">
                            <span className="font-bold text-base">داخلہ فارم (قدیم)</span>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-xs">تاریخ داخلہ:</span>
                                <span className="border-b border-black px-1 min-w-[80px] text-center text-xs">{v(data.admissionDate)}</span>
                                <span className="text-xs">/</span>
                                <span className="border-b border-black px-1 min-w-[30px] text-center text-xs"></span>
                                <span className="text-xs">/</span>
                                <span className="border-b border-black px-1 min-w-[50px] text-center text-xs"></span>
                            </div>
                        </div>
                        
                        {/* Row 2: Content with Photo inside */}
                        <div className="flex gap-2">
                            {/* Form Fields */}
                            <div className="flex-1 flex flex-col justify-between" style={{minHeight: '120px'}}>
                                {/* Desired Grade - Top */}
                                <div className="flex items-center justify-center gap-2" style={{marginTop: '50px'}}>
                                    <span className="font-bold text-lg">مطلوبہ درجہ:</span>
                                    <span className="border-b border-black flex-1 text-center max-w-[200px]">{v(data.studentClass || data.class)}</span>
                                </div>
                                
                                {/* Token and Exam Marks - Bottom */}
                                <div className="flex items-end justify-between">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-xs">ٹوکن نمبر:</span>
                                        {boxes(data.tokenNumber || data.formTokenNumber, 6)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-xs">داخلہ امتحان میں حاصل کردہ نمبرات:</span>
                                        <span className="border border-black px-1 min-w-[25px] text-center text-xs">{v(data.examMarks)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Photo Box - Now inside the container */}
                            <div className="flex-shrink-0">
                                <div className="border-2 border-black h-[170px] w-[132px] flex flex-col items-center justify-center text-sm font-bold overflow-hidden bg-white">
                                    {data.photoUrl ? (
                                        <img src={String(data.photoUrl)} alt="تصویر" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="transform -rotate-90">تصویر</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kawaif Nama Section */}
                    <div className="border-2 border-black p-3 mb-3 relative pt-6">
                        <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                            <div className="bg-black text-white px-6 py-1 rounded-full font-bold text-sm">
                                کوائف نامہ
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            {/* Row 1: Name, Parentage, DOB, Class */}
                            <div className="grid grid-cols-4 gap-2">
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">نام:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.fullName || data.studentName)}</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">ولدیت:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.guardianName || data.fatherName)}</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">تاریخ پیدائش:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.dob2 || data.dateOfBirth)}</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">مطلوبہ درجہ:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.studentClass || data.class)}</span>
                                </div>
                            </div>
                            
                            {/* Row 2: Current Address */}
                            <div className="flex items-end gap-1">
                                <span className="font-bold text-xs whitespace-nowrap">موجودہ پتہ:</span>
                                <span className="border-b border-black flex-1 text-right text-xs">{v(data.currentAddress2 || data.currentAddress)}</span>
                            </div>
                            
                            {/* Row 3: Permanent Address */}
                            <div className="flex items-end gap-1">
                                <span className="font-bold text-xs whitespace-nowrap">مستقل پتہ:</span>
                                <span className="border-b border-black flex-1 text-right text-xs">{v(data.permanentAddress2 || data.permanentAddress)}</span>
                            </div>
                            
                            {/* Row 4: Contact & CNIC */}
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs whitespace-nowrap">رابطہ نمبر</span>
                                    {boxes(data.phone || data.contact, 11)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs whitespace-nowrap">شناختی کارڈ نمبر</span>
                                    {boxes(data.idNumber || data.cnic, 13)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sabqa Karkardagi Section */}
                    <div className="border-2 border-black p-3 mb-3 relative pt-6">
                        <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                            <div className="bg-black text-white px-6 py-1 rounded-full font-bold text-sm">
                                سابقہ کارکردگی
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            {/* Row 1 */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">وفاقی کا آخری پاس کردہ درجہ:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.lastWafaqClass)}</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">حاصل کردہ نمبرات:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.lastWafaqMarks)}</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">تقدیر:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.lastWafaqGrade)}</span>
                                </div>
                            </div>
                            
                            {/* Row 2: Madrasa */}
                            <div className="flex items-end gap-1">
                                <span className="font-bold text-xs whitespace-nowrap">نام مدرسہ / جامعہ مع مکمل پتہ:</span>
                                <span className="border-b border-black flex-1 text-right text-xs">{v(data.prevMadrasaStart || data.previousMadrasa)}</span>
                            </div>
                            
                            {/* Row 3: Wafaq Details */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">وفاقی رقم الجلوس:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.wafaqRollNo2 || data.wafaqRollNo)}</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">سال:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.wafaqYear)}</span>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="font-bold text-xs">رقم التسحیل</span>
                                    {boxes(data.wafaqRegNo, 10)}
                                </div>
                            </div>
                            
                            {/* Row 4: Education Type */}
                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs whitespace-nowrap">عصری تعلیم:</span>
                                    <span className="border-b border-black px-4 text-xs">{v(data.contemporaryEducation)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs whitespace-nowrap">اضافی تعلیم:</span>
                                    <div className="border border-black flex">
                                        <div className="border-l border-black px-2 py-0.5 flex items-center gap-1">
                                            <span className="text-xs">حافظ قرآن</span>
                                            <div className={`h-3 w-3 border border-black ${data.addEduHifz ? 'bg-black' : ''}`}></div>
                                        </div>
                                        <div className="px-2 py-0.5 flex items-center gap-1">
                                            <span className="text-xs">ناظرہ قرآن</span>
                                            <div className={`h-3 w-3 border border-black ${data.addEduNazra ? 'bg-black' : ''}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Guardian Section */}
                    <div className="border-2 border-black p-3 mb-3 relative pt-6">
                        <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                            <div className="bg-black text-white px-6 py-1 rounded-full font-bold text-sm">
                                کوائف نامہ برائے سرپرست
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            {/* Row 1 */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">نام:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.guardianNameSection || data.guardianName)}</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">ولدیت:</span>
                                    <span className="border-b border-black flex-1 text-center text-xs">{v(data.guardianFatherName)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs whitespace-nowrap">رابطہ نمبر 1</span>
                                    {boxes(data.guardianContactSection || data.phone, 11)}
                                </div>
                            </div>
                            
                            {/* Row 2 */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs whitespace-nowrap">رابطہ نمبر 2</span>
                                    {boxes(data.guardianPhone2, 11)}
                                </div>
                                <div className="flex items-end gap-1 flex-1">
                                    <span className="font-bold text-xs whitespace-nowrap">موجودہ پتہ:</span>
                                    <span className="border-b border-black flex-1 text-right text-xs">{v(data.guardianCurrentAddress || data.currentAddress2)}</span>
                                </div>
                            </div>
                            
                            {/* Row 3: CNIC, Profession, Nationality */}
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs whitespace-nowrap">شناختی کارڈ نمبر</span>
                                    {boxes(data.guardianCnic, 13)}
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="font-bold text-xs whitespace-nowrap">پیشہ</span>
                                    <span className="border-b border-black px-2 min-w-[80px] text-center text-xs">{v(data.guardianProfession)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs">سرپرست سے رشتہ</span>
                                    <span className="border-b border-black px-2 min-w-[80px] text-center text-xs">{v(data.guardianRelation || data.relation2)}</span>
                                </div>
                            </div>
                            
                            {/* Row 4: Guardian CNIC boxes */}
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-xs whitespace-nowrap">شناختی کارڈ نمبر</span>
                                {boxes(data.guardianCnic2 || data.guardianCnic, 13)}
                            </div>
                        </div>
                    </div>

                    {/* Office Use Section */}
                    <div className="border-2 border-black p-3 relative pt-6 mt-auto">
                        <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                            <div className="bg-black text-white px-6 py-1 rounded-full font-bold text-sm">
                                دفتری کارروائی
                            </div>
                        </div>
                        
                        <div className="flex items-end justify-between pt-2">
                            <div className="flex items-end gap-1">
                                <span className="font-bold text-xs whitespace-nowrap">دستخط ناظم:</span>
                                <span className="border-b border-black min-w-[100px]"></span>
                            </div>
                            <div className="flex items-end gap-1">
                                <span className="font-bold text-xs whitespace-nowrap">دستخط مہتمم / نائب مہتمم:</span>
                                <span className="border-b border-black min-w-[100px]"></span>
                            </div>
                            <div className="flex items-end gap-1">
                                <span className="font-bold text-xs whitespace-nowrap">مہر جامعہ:</span>
                                <span className="border-b border-black min-w-[80px]"></span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <Button onClick={handlePrint} className="w-full print:hidden" size="lg">
                <Printer className="h-4 w-4 ml-2" />
                فارم پرنٹ کریں
            </Button>

            <style>{`
        /* 
           GOLDEN PRINT STANDARDS (DO NOT MODIFY WITHOUT TESTING ON A4)
           - Scale 0.96 ensures fit on all printers without overflow.
           - mt-auto keeps "Office Use" at bottom of A4.
           - 8mm/10mm padding is balanced for A4.
        */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          body * {
            visibility: hidden;
          }
          .paper-print {
            visibility: visible;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .paper-print * {
            visibility: visible;
          }
          .paper-page {
            width: 210mm !important;
            height: 297mm !important;
            padding: 8mm 10mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            background: white !important;
            color: black !important;
            font-size: 10pt !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            transform: scale(0.96);
            transform-origin: top center;
          }
          
          /* Print-specific adjustments */
          .paper-page .mb-3 {
            margin-bottom: 4mm !important;
          }

          .paper-page .p-3 {
            padding: 5mm 4mm 4mm 4mm !important;
          }

          .paper-page .pt-6 {
            padding-top: 8mm !important;
          }

          .paper-page .space-y-2 > * + * {
            margin-top: 3mm !important;
          }

          .paper-page .mt-2 {
            margin-top: 3mm !important;
          }

          .paper-page .gap-2 {
            gap: 4mm !important;
          }

          .paper-page .h-20 {
            height: 18mm !important;
          }

          .paper-page .-top-3.5 {
            top: -4mm !important;
          }

          .paper-page .rounded-full {
            border-radius: 9999px !important;
          }

          .paper-page .px-6 {
            padding-left: 6mm !important;
            padding-right: 6mm !important;
          }

          .paper-page .py-1 {
            padding-top: 1.5mm !important;
            padding-bottom: 1.5mm !important;
          }

          .paper-page .mt-auto {
            margin-top: auto !important;
          }

          .paper-page .border-2 {
            border-width: 1.5pt !important;
            border-color: black !important;
          }
          
          .paper-page .border {
            border-width: 0.75pt !important;
            border-color: black !important;
          }
          
          .paper-page .border-b {
            border-bottom-width: 0.75pt !important;
            border-bottom-color: black !important;
          }
          
          .paper-page .border-l {
            border-left-width: 0.75pt !important;
            border-left-color: black !important;
          }
          
          /* Ensure boxes print correctly - smaller for A4 fit */
          .paper-page .h-5.w-4 {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            border: 0.75pt solid black !important;
            background: white !important;
            height: 4.5mm !important;
            width: 3.5mm !important;
            font-size: 8pt !important;
            line-height: 1 !important;
            margin: 0 !important;
          }
          
          .paper-page .h-3.w-3 {
            height: 3mm !important;
            width: 3mm !important;
          }
          
          /* Font sizes for print */
          .paper-page .text-2xl {
            font-size: 16pt !important;
          }
          
          .paper-page .text-lg {
            font-size: 12pt !important;
          }
          
          .paper-page .text-base {
            font-size: 10pt !important;
          }
          
          .paper-page .text-sm {
            font-size: 9pt !important;
          }
          
          .paper-page .text-xs {
            font-size: 8pt !important;
          }
          
          /* Section header positioning */
          .paper-page .absolute {
            position: absolute !important;
          }
          
          .paper-page .-top-4 {
            top: -0.6rem !important;
          }

          .paper-page .bg-black {
            background-color: black !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Photo box in print */
          .paper-page .h-\[170px\] {
            height: 35mm !important;
            width: 28mm !important;
          }
          
          /* Prevent overflow */
          .paper-page * {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
        </div>
    );
}
