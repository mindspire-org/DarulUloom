import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThermalSlipProps {
    tokenNumber: string;
    studentName: string;
    fatherName: string;
    grade: string;
    date: string;
    contact?: string;
    residency?: string;
    testDate?: string;
    resultDate?: string;
    photoUrl?: string;
    cnic?: string;
    passportNumber?: string;
    bformNumber?: string;
    idType?: "cnic" | "passport" | "bform";
    category?: string;
    statusType?: string;
}

export function ThermalSlip({
    tokenNumber,
    studentName,
    fatherName,
    grade,
    date,
    contact,
    residency,
    testDate,
    resultDate,
    photoUrl,
    cnic,
    passportNumber,
    bformNumber,
    idType,
    category,
    statusType,
}: ThermalSlipProps) {
    const slipUrl = `${window.location.origin}/slip/${tokenNumber}`;
    const qrCodeData = slipUrl;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=600,height=800');
        if (!printWindow) return;

        const printContent = `
      <!DOCTYPE html>
      <html lang="ur" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>ٹوکن پرنٹ - ${tokenNumber}</title>
        <style>
          @font-face {
            font-family: 'AlQalam Taj Nastaleeq';
            src: local('AlQalam Taj Nastaleeq'), local('AlQalamTajNastaleeq');
          }
          @media print {
            @page { 
              size: auto; 
              margin: 0; 
            }
            body { 
              margin: 0; 
              padding: 0; 
              width: 60mm;
            }
            .no-print, .no-print * { 
              display: none !important; 
              visibility: hidden !important;
            }
            .receipt {
              height: 94mm !important;
              page-break-inside: avoid;
              border: 1px dashed #000 !important;
              margin-bottom: 0 !important;
              padding: 2mm !important;
              overflow: hidden;
              width: 60mm !important;
            }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'AlQalam Taj Nastaleeq', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;
            text-align: center;
            width: 60mm;
            margin: 0 auto;
            background: white;
            color: black;
            direction: rtl;
          }
          .receipt-wrapper {
            width: 100%;
            padding: 0;
          }
          .receipt {
            width: 60mm;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1.5px solid black;
            padding: 2mm;
            height: 94mm;
            background: white;
            position: relative;
            overflow: hidden;
          }
          .header {
            width: 100%;
            border-bottom: 1.5px double black;
            padding-bottom: 0.5mm;
            margin-bottom: 1mm;
          }
          .shop-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 0;
            line-height: 1.1;
          }
          .shop-address {
            font-size: 12px;
            font-weight: bold;
            line-height: 1;
          }
          .token-section {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 2px;
            padding: 1mm 0;
            border-bottom: 1px dashed #000;
            margin-bottom: 1mm;
            width: 100%;
          }
          .student-photo {
            width: 40px;
            height: 50px;
            border-radius: 2px;
            object-fit: cover;
            border: 1px solid black;
            flex-shrink: 0;
          }
          .token-number-container {
            text-align: center;
            flex: 1;
            overflow: hidden;
          }
          .token-label {
            font-size: 9px;
            color: #000;
            margin-bottom: 0;
          }
          .token-number {
            font-size: 16px;
            font-weight: bold;
            font-family: monospace;
            white-space: nowrap;
            line-height: 1;
          }
          .qrcode-box {
            width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .qrcode-box img {
            width: 45px !important;
            height: 45px !important;
          }
          .details {
            width: 100%;
            border-bottom: 1px dashed black;
            padding-bottom: 0.5mm;
            margin-bottom: 1mm;
            flex: 1;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 0.2mm 0;
            font-size: 12px;
            line-height: 1.1;
          }
          .detail-label {
            font-weight: bold;
            text-align: right;
            flex: 0 0 40%;
          }
          .detail-value {
            text-align: left;
            flex: 0 0 60%;
            padding-right: 2mm;
            font-weight: 500;
          }
          .footer {
            width: 100%;
            padding-top: 0.5mm;
          }
          .footer-text {
            font-size: 10px;
            margin-bottom: 0;
            line-height: 1;
          }
          .thank-you {
            font-size: 14px;
            font-weight: bold;
            margin-top: 0;
            line-height: 1;
          }
          .print-btn-container {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            background: rgba(255,255,255,0.8);
            padding: 10px;
            z-index: 100;
          }
          .print-btn {
            padding: 10px 40px;
            font-size: 18px;
            background: #0f766e;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 6px;
            font-family: inherit;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="receipt-wrapper">
          <div class="receipt">
            <div class="header">
              <div class="shop-name">جامعہ اسلامیہ دارالعلوم سرحد</div>
              <div class="shop-address">ٹوکن سلپ</div>
            </div>
            
            <div class="token-section">
              ${photoUrl ? `<img src="${photoUrl}" alt="Student" class="student-photo">` : `<div class="student-photo" style="display:flex;align-items:center;justify-content:center;background:#eee;font-size:8px;">تصویر</div>`}
              <div class="token-number-container">
                <div class="token-label">ٹوکن نمبر</div>
                <div class="token-number">${tokenNumber}</div>
              </div>
              <div class="qrcode-box qrcode-placeholder"></div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">نام:</span>
                <span class="detail-value">${studentName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">والد:</span>
                <span class="detail-value">${fatherName}</span>
              </div>
              <div className="detail-row">
                <span class="detail-label">درجہ:</span>
                <span class="detail-value">${grade}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">تاریخ:</span>
                <span class="detail-value">${date}</span>
              </div>
              ${testDate ? `
              <div class="detail-row">
                <span class="detail-label">انٹری ٹیسٹ:</span>
                <span class="detail-value">${testDate}</span>
              </div>
              ` : ''}
              ${resultDate ? `
              <div class="detail-row">
                <span class="detail-label">نتیجہ:</span>
                <span class="detail-value">${resultDate}</span>
              </div>
              ` : ''}
              ${idType === 'passport' ? `
              <div class="detail-row">
                <span class="detail-label">پاسپورٹ نمبر:</span>
                <span class="detail-value">${passportNumber || '—'}</span>
              </div>
              ` : idType === 'bform' ? `
              <div class="detail-row">
                <span class="detail-label">بی فارم نمبر:</span>
                <span class="detail-value">${bformNumber || '—'}</span>
              </div>
              ` : cnic ? `
              <div class="detail-row">
                <span class="detail-label">شناختی کارڈ:</span>
                <span class="detail-value">${cnic}</span>
              </div>
              ` : ''}
              ${contact ? `
              <div class="detail-row">
                <span class="detail-label">رابطہ:</span>
                <span class="detail-value" dir="ltr">${contact}</span>
              </div>
              ` : ''}
              ${statusType ? `
              <div class="detail-row">
                <span class="detail-label">حیثیت:</span>
                <span class="detail-value">${statusType}</span>
              </div>
              ` : ''}
              ${category ? `
              <div class="detail-row">
                <span class="detail-label">تعلیمی حیثیت:</span>
                <span class="detail-value">${category === 'Wafaq' ? 'وفاقی' : category === 'Non-Wafaq' ? 'غیر وفاقی' : category}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <div class="footer-text">${new Date().toLocaleString('ur-PK')}</div>
              <div class="thank-you">جزاک اللہ خیراً</div>
            </div>
          </div>
        </div>
        <div class="print-btn-container no-print">
          <button class="print-btn" onclick="window.print();">پرنٹ کریں</button>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode-generator/qrcode.js"></script>
        <script>
          function generateQRs() {
            try {
              if (typeof qrcode === 'undefined') return;
              const placeholders = document.querySelectorAll('.qrcode-placeholder');
              placeholders.forEach(el => {
                const qr = qrcode(0, 'L');
                qr.addData(${JSON.stringify(qrCodeData)});
                qr.make();
                el.innerHTML = qr.createImgTag(3, 3);
              });
            } catch (e) {}
          }
          window.onload = function() {
            generateQRs();
            document.querySelector('.print-btn').focus();
          };
        </script>
      </body>
      </html>
    `;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    return (
        <div className="space-y-4">
            {/* Preview Style matches the Print Style */}
            <div 
                className="thermal-slip-preview bg-white text-black p-4 rounded-lg border shadow-sm mx-auto overflow-hidden"
                style={{ 
                    width: '100%', 
                    maxWidth: '300px',
                    fontFamily: "'AlQalam Taj Nastaleeq', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif",
                    direction: 'rtl'
                }}
            >
                <div style={{ border: '1.5px solid black', padding: '2mm', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ borderBottom: '1.5px double black', paddingBottom: '1mm', marginBottom: '2mm', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>جامعہ اسلامیہ دارالعلوم سرحد</h2>
                        <p style={{ fontSize: '12px', fontWeight: 'bold' }}>ٹوکن سلپ</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px', padding: '1mm 0', borderBottom: '1px dashed #000', marginBottom: '2mm' }}>
                        {photoUrl ? (
                            <img src={photoUrl} alt="Student" style={{ width: '40px', height: '50px', borderRadius: '2px', objectFit: 'cover', border: '1px solid black' }} />
                        ) : (
                            <div style={{ width: '40px', height: '50px', borderRadius: '2px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', border: '1px solid black' }}>تصویر</div>
                        )}
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '9px' }}>ٹوکن نمبر</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>{tokenNumber}</div>
                        </div>
                        <div style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <QRCodeSVG value={qrCodeData} size={45} level="L" />
                        </div>
                    </div>

                    <div style={{ flex: 1, borderBottom: '1px dashed black', paddingBottom: '1mm', marginBottom: '1mm' }}>
                        {[
                            { label: 'نام:', value: studentName },
                            { label: 'والد:', value: fatherName },
                            { label: 'درجہ:', value: grade },
                            { label: 'تاریخ:', value: date },
                            testDate && { label: 'انٹری ٹیسٹ:', value: testDate },
                            resultDate && { label: 'نتیجہ:', value: resultDate },
                            idType === 'passport' ? { label: 'پاسپورٹ:', value: passportNumber || '—' } : 
                            idType === 'bform' ? { label: 'بی فارم:', value: bformNumber || '—' } : 
                            cnic ? { label: 'شناختی کارڈ:', value: cnic } : null,
                            contact && { label: 'رابطہ:', value: contact },
                            statusType && { label: 'حیثیت:', value: statusType },
                            category && { label: 'تعلیمی حیثیت:', value: category === 'Wafaq' ? 'وفاقی' : category === 'Non-Wafaq' ? 'غیر وفاقی' : category },
                        ].filter(Boolean).map((row: any, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '1px' }}>
                                <span style={{ fontWeight: 'bold', flex: '0 0 40%' }}>{row.label}</span>
                                <span style={{ textAlign: 'left', flex: '0 0 60%' }}>{row.value}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', paddingTop: '1mm' }}>
                        <div style={{ fontSize: '10px' }}>{new Date().toLocaleString('ur-PK')}</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>جزاک اللہ خیراً</div>
                    </div>
                </div>
            </div>

            <Button onClick={handlePrint} className="w-full bg-orange-600 hover:bg-orange-700" size="lg">
                <Printer className="h-4 w-4 ml-2" />
                پرنٹ کریں
            </Button>
        </div>
    );
}
