import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, RefreshCw, Trash2, Eye, Printer } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { type TokenRecord } from "@/contexts/TokenContext";
import { tokensAPI, toAbsoluteAssetUrl } from "@/lib/api";
import { toast } from "sonner";

export default function TokenManagement() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<TokenRecord | null>(null);
  const [viewing, setViewing] = useState<TokenRecord | null>(null);
  const [printing, setPrinting] = useState<TokenRecord | null>(null);
  const [editForm, setEditForm] = useState({
    studentName: "",
    fatherName: "",
    class: "",
    cnic: "",
    contact: "",
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await tokensAPI.getMy();
      const rows = (res.data.data ?? []) as any[];
      const mappedTokens = rows.map((s) => {
        // Calculate dates with validation
        let issueDate = "";
        if (s.createdAt) {
          try {
            const date = new Date(s.createdAt);
            issueDate = isNaN(date.getTime()) ? "" : date.toLocaleDateString("ur-PK");
          } catch (e) {
            issueDate = "";
          }
        }

        let testDate = "";
        if (s.testDate) {
          try {
            const date = new Date(s.testDate);
            testDate = isNaN(date.getTime()) ? "" : date.toLocaleDateString("ur-PK");
          } catch (e) {
            testDate = "";
          }
        }

        let resultDate = "";
        if (s.resultDate) {
          try {
            const date = new Date(s.resultDate);
            resultDate = isNaN(date.getTime()) ? "" : date.toLocaleDateString("ur-PK");
          } catch (e) {
            resultDate = "";
          }
        }

        return {
          id: s._id,
          tokenNumber: s.tokenNumber,
          studentName: s.studentName,
          fatherName: s.fatherName,
          class: s.class,
          issueDate,
          status: s.status,
          cnic: s.cnic,
          passportNumber: s.passportNumber,
          idType: s.idType,
          bformNumber: s.bformNumber,
          contact: s.contact,
          category: s.category,
          statusType: s.statusType,
          photoUrl: toAbsoluteAssetUrl(s.photoUrl || ""),
          dateOfBirth: s.dateOfBirth,
          age: s.age,
          currentAddress: s.currentAddress,
          permanentAddress: s.permanentAddress,
          testDate,
          resultDate,
        };
      });
      
      setTokens(mappedTokens);
      
      // Also sync to localStorage for Verification page
      localStorage.setItem("jamia_tokens_v1", JSON.stringify(mappedTokens));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "ٹوکن فہرست لوڈ نہیں ہو سکی");
      
      // Try to load from localStorage if API fails
      const stored = localStorage.getItem("jamia_tokens_v1");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setTokens(parsed);
          toast.info("لوکل اسٹوریج سے ٹوکن لوڈ ہوے");
        } catch {
          setTokens([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return tokens;
    return tokens.filter(
      (t) =>
        t.tokenNumber.includes(q) ||
        t.studentName.includes(q) ||
        t.fatherName.includes(q) ||
        t.class.includes(q),
    );
  }, [tokens, query]);

  const openEdit = (token: TokenRecord) => {
    // Navigate to token-counter with the token data for editing
    navigate("/token-counter", {
      state: {
        editToken: token,
      },
    });
    toast.success("ٹوکن کاونٹر پر منتقل ہو رہا ہے...");
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const openPrint = (token: TokenRecord) => {
    setPrinting(token);
  };

  const closePrint = () => {
    setPrinting(null);
  };

  const openView = (token: TokenRecord) => {
    setViewing(token);
  };

  const closeView = () => {
    setViewing(null);
  };

  const handleThermalPrint = () => {
        if (!printing) return;

        // URL link for the QR code
        const slipUrl = `${window.location.origin}/slip/${printing.tokenNumber}`;
        const qrCodeData = slipUrl;

    const photoUrl = printing.photoUrl ? printing.photoUrl : '';

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("پاپ اپ بلاک ہے، براہ کرم اجازت دیں");
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ٹوکن پرنٹ - ${printing.tokenNumber}</title>
        <style>
          @font-face {
            font-family: 'AlQalam Taj Nastaleeq';
            src: local('AlQalam Taj Nastaleeq'), local('AlQalamTajNastaleeq'),
              url('/fonts/AlQalamTajNastaleeq.ttf') format('truetype');
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
                <div class="token-number">${printing.tokenNumber}</div>
              </div>
              <div class="qrcode-box qrcode-placeholder"></div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">نام:</span>
                <span class="detail-value">${printing.studentName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">والد:</span>
                <span class="detail-value">${printing.fatherName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">درجہ:</span>
                <span class="detail-value">${printing.class}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">تاریخ:</span>
                <span class="detail-value">${printing.issueDate}</span>
              </div>
              ${printing.testDate ? `
              <div class="detail-row">
                <span class="detail-label">انٹری ٹیسٹ:</span>
                <span class="detail-value">${printing.testDate}</span>
              </div>
              ` : ''}
              ${printing.resultDate ? `
              <div class="detail-row">
                <span class="detail-label">نتیجہ:</span>
                <span class="detail-value">${printing.resultDate}</span>
              </div>
              ` : ''}
              ${printing.idType === 'passport' ? `
              <div class="detail-row">
                <span class="detail-label">پاسپورٹ نمبر:</span>
                <span class="detail-value">${printing.passportNumber || '—'}</span>
              </div>
              ` : printing.idType === 'bform' ? `
              <div class="detail-row">
                <span class="detail-label">بی فارم نمبر:</span>
                <span class="detail-value">${(printing as any).bformNumber || '—'}</span>
              </div>
              ` : printing.cnic ? `
              <div class="detail-row">
                <span class="detail-label">شناختی کارڈ:</span>
                <span class="detail-value">${printing.cnic}</span>
              </div>
              ` : ''}
              ${printing.contact ? `
              <div class="detail-row">
                <span class="detail-label">رابطہ:</span>
                <span class="detail-value" dir="ltr">${printing.contact}</span>
              </div>
              ` : ''}
              ${printing.statusType ? `
              <div class="detail-row">
                <span class="detail-label">حیثیت:</span>
                <span class="detail-value">${printing.statusType}</span>
              </div>
              ` : ''}
              ${printing.category ? `
              <div class="detail-row">
                <span class="detail-label">تعلیمی حیثیت:</span>
                <span class="detail-value">${printing.category === 'Wafaq' ? 'وفاقی' : printing.category === 'Non-Wafaq' ? 'غیر وفاقی' : printing.category}</span>
              </div>
              ` : ''}
              ${printing.age ? `
              <div class="detail-row">
                <span class="detail-label">عمر:</span>
                <span class="detail-value">${printing.age} سال</span>
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
          // Generate QR Codes for all slips
          function generateQRs() {
            try {
              if (typeof qrcode === 'undefined') {
                console.error('QR Library Not Loaded');
                return;
              }
              const placeholders = document.querySelectorAll('.qrcode-placeholder');
              placeholders.forEach(el => {
                const typeNumber = 0;
                const errorCorrectionLevel = 'L';
                const qr = qrcode(typeNumber, errorCorrectionLevel);
                qr.addData(${JSON.stringify(qrCodeData)});
                qr.make();
                el.innerHTML = qr.createImgTag(3, 3);
              });
            } catch (e) {
              console.error('QR Code generation failed:', e);
            }
          }

          // Generate QRs on load
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
    
    toast.success("پرنٹ ونڈو کھول دی گئی");
    closePrint();
  };

  const saveEdit = () => {
    if (!editing) return;
    (async () => {
      try {
        await tokensAPI.updateMy(editing.id, {
          studentName: editForm.studentName,
          fatherName: editForm.fatherName,
          class: editForm.class,
          cnic: editForm.cnic,
          passportNumber: (editing as any).passportNumber,
          idType: (editing as any).idType,
          contact: editForm.contact,
        });
        toast.success("ٹوکن اپ ڈیٹ ہو گیا");
        closeEdit();
        await refresh();
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "اپ ڈیٹ نہیں ہو سکا");
      }
    })();
  };

  const deleteToken = (id: string) => {
    (async () => {
      // Find token number and student name before deleting
      const tokenToDelete = tokens.find((t) => t.id === id);
      const tokenNumber = tokenToDelete?.tokenNumber;
      const studentName = tokenToDelete?.studentName;
      
      try {
        await tokensAPI.deleteMy(id);
        
        // 1. Remove admission form and sync with all possible local keys
        const possibleKeys = ["jamia_tokens_v1", "tokens", "tokenManagement", "jamia_tokens"];
        possibleKeys.forEach(key => {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed)) {
                const filtered = parsed.filter((t: any) => t.id !== id && t.tokenNumber !== tokenNumber);
                localStorage.setItem(key, JSON.stringify(filtered));
              }
            }
          } catch (e) {}
        });

        if (tokenNumber) {
          localStorage.removeItem(`admissionForm_${tokenNumber}`);
        }

        // 2. Cascade delete hostel allocation if exists
        const savedBeds = localStorage.getItem("beds");
        if (savedBeds) {
          const currentBeds = JSON.parse(savedBeds);
          // Try finding by tokenNumber first, then studentName as fallback
          const bedToDelete = currentBeds.find((b: any) => 
            (tokenNumber && b.tokenNumber === tokenNumber) || 
            (studentName && b.studentName === studentName)
          );
          
          if (bedToDelete) {
            // Remove from beds list
            const updatedBeds = currentBeds.filter((b: any) => 
              !(tokenNumber && b.tokenNumber === tokenNumber) && 
              !(studentName && b.studentName === studentName)
            );
            localStorage.setItem("beds", JSON.stringify(updatedBeds));

            // Update hostel occupied count
            const savedHostels = localStorage.getItem("hostels");
            if (savedHostels) {
              const hostelsList = JSON.parse(savedHostels);
              const updatedHostels = hostelsList.map((h: any) =>
                h._id === bedToDelete.hostelId 
                  ? { ...h, occupied: Math.max(0, (h.occupied || 0) - 1) } 
                  : h
              );
              localStorage.setItem("hostels", JSON.stringify(updatedHostels));
            }

            // Update room occupied count
            const savedRooms = localStorage.getItem("rooms");
            if (savedRooms) {
              const roomsList = JSON.parse(savedRooms);
              const updatedRooms = roomsList.map((r: any) =>
                (r.hostelId === bedToDelete.hostelId && r.roomNumber === bedToDelete.roomNumber)
                  ? { ...r, occupied: Math.max(0, (r.occupied || 0) - 1) }
                  : r
              );
              localStorage.setItem("rooms", JSON.stringify(updatedRooms));
            }

            // Notify all components (Dashboard, Residents, etc.)
            window.dispatchEvent(new CustomEvent("hostelsUpdated"));
            toast.info("ہاسٹل الاٹمنٹ بھی حذف کر دی گئی ہے");
          }
        }
        
        toast.success("ٹوکن حذف ہو گیا");
        await refresh();
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "حذف نہیں ہو سکا");
        
        // Fallback: Remove from localStorage even if API fails
        try {
          const possibleKeys = ["jamia_tokens_v1", "tokens", "tokenManagement", "jamia_tokens"];
          possibleKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed)) {
                const filtered = parsed.filter((t: any) => t.id !== id && t.tokenNumber !== tokenNumber);
                localStorage.setItem(key, JSON.stringify(filtered));
                if (key === "jamia_tokens_v1") setTokens(filtered);
              }
            }
          });
        } catch (err) {
          console.error("Local storage sync failed", err);
        }
        
        // Also remove any saved admission form for this token
        if (tokenNumber) {
          localStorage.removeItem(`admissionForm_${tokenNumber}`);
        }

        // Cascade delete from localStorage fallback
        const savedBeds = localStorage.getItem("beds");
        if (savedBeds) {
          try {
            const currentBeds = JSON.parse(savedBeds);
            if (Array.isArray(currentBeds)) {
              const updatedBeds = currentBeds.filter((b: any) => 
                !(tokenNumber && b.tokenNumber === tokenNumber) && 
                !(studentName && b.studentName === studentName)
              );
              localStorage.setItem("beds", JSON.stringify(updatedBeds));
              window.dispatchEvent(new CustomEvent("hostelsUpdated"));
            }
          } catch (err) {
            console.error("Beds sync failed", err);
          }
        }
        
        toast.error("لوکل اسٹوریج سے حذف کرنے کی کوشش کی گئی (API فیل)");
      }
    })();
  };

  const regenerateToken = (id: string) => {
    (async () => {
      try {
        await tokensAPI.regenerateMyToken(id);
        toast.success("نیا ٹوکن نمبر بن گیا");
        await refresh();
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "ٹوکن نمبر تبدیل نہیں ہو سکا");
      }
    })();
  };

  return (
    <DashboardLayout title="ٹوکن مینجمنٹ">
      <PageHeader
        title="ٹوکن فہرست"
        description="یہاں سے جاری شدہ ٹوکن دیکھیں، ترمیم کریں، حذف کریں یا نیا ٹوکن نمبر بنائیں"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>تلاش</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ٹوکن نمبر، نام یا درجہ سے تلاش کریں"
            className="h-12"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تمام ٹوکن ({filtered.length})</CardTitle>
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
                <TableHead className="text-right">ٹوکن نمبر</TableHead>
                <TableHead className="text-right">نام</TableHead>
                <TableHead className="text-right">والد کا نام</TableHead>
                <TableHead className="text-right">ID نمبر</TableHead>
                <TableHead className="text-right">درجہ</TableHead>
                <TableHead className="text-right">حیثیت</TableHead>
                <TableHead className="text-right">تاریخ اجراء</TableHead>
                <TableHead className="text-right">حیثیت</TableHead>
                <TableHead className="text-right">عمل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono font-semibold">
                      {t.tokenNumber}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {t.studentName}
                    </TableCell>
                    <TableCell>{t.fatherName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {t.idType === 'passport' ? t.passportNumber || "—" : t.idType === 'bform' ? t.bformNumber || "—" : t.cnic || "—"}
                    </TableCell>
                    <TableCell>{t.class}</TableCell>
                    <TableCell>{t.statusType || "—"}</TableCell>
                    <TableCell>{t.issueDate}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPrint(t)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openView(t)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(t)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => regenerateToken(t.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
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
                              <AlertDialogTitle>ٹوکن حذف کریں؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                یہ ٹوکن مستقل طور پر حذف ہو جائے گا۔
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>منسوخ</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteToken(t.id)}
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
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                    کوئی ٹوکن نہیں ملا
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>ٹوکن میں ترمیم</DialogTitle>
            <DialogDescription>
              طالب علم کی معلومات اپ ڈیٹ کریں
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نام</Label>
              <Input
                value={editForm.studentName}
                onChange={(e) =>
                  setEditForm({ ...editForm, studentName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>والد کا نام</Label>
              <Input
                value={editForm.fatherName}
                onChange={(e) =>
                  setEditForm({ ...editForm, fatherName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>درجہ</Label>
              <Input
                value={editForm.class}
                onChange={(e) => setEditForm({ ...editForm, class: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>شناختی کارڈ نمبر</Label>
                <Input
                  value={editForm.cnic}
                  onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>رابطہ نمبر</Label>
                <Input
                  value={editForm.contact}
                  onChange={(e) =>
                    setEditForm({ ...editForm, contact: e.target.value })
                  }
                />
              </div>
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

      {/* Print Token Dialog */}
      <Dialog open={!!printing} onOpenChange={(open) => !open && closePrint()}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>ٹوکن پرنٹ</DialogTitle>
            <DialogDescription>
              تھرمل پرنٹر سے پرنٹ کرنے کے لیے تیار
            </DialogDescription>
          </DialogHeader>

          {printing && (
            <div className="space-y-6">
              <div className="border-2 border-black p-5 text-center mx-auto max-w-[320px] bg-white">
                <div className="border-b-2 border-emerald-700 pb-3 mb-3">
                  <p className="text-sm text-gray-600 mb-1">ڈیجیٹل ڈیش بورڈ</p>
                  <p className="text-3xl font-bold text-orange-600 tracking-wider">{printing.tokenNumber}</p>
                </div>
                
                <table className="w-full text-right text-sm" dir="rtl">
                  <tbody>
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold w-1/2">نام:</td>
                      <td className="py-2 text-left">{printing.studentName}</td>
                    </tr>
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold">والد کا نام:</td>
                      <td className="py-2 text-left">{printing.fatherName}</td>
                    </tr>
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold">درجہ:</td>
                      <td className="py-2 text-left">{printing.class}</td>
                    </tr>
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold">تاریخ اجراء:</td>
                      <td className="py-2 text-left">{printing.issueDate}</td>
                    </tr>
                    {printing.testDate && (
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold">انٹری ٹیسٹ کی تاریخ:</td>
                      <td className="py-2 text-left text-blue-600 font-semibold">{printing.testDate}</td>
                    </tr>
                    )}
                    {printing.resultDate && (
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold">نتیجے کی تاریخ:</td>
                      <td className="py-2 text-left text-green-600 font-semibold">{printing.resultDate}</td>
                    </tr>
                    )}
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold">
                        {printing.idType === 'passport' ? 'پاسپورٹ نمبر:' : printing.idType === 'bform' ? 'بی فارم نمبر:' : 'شناختی کارڈ:'}
                      </td>
                      <td className="py-2 text-left">
                        {printing.idType === 'passport' ? printing.passportNumber || '—' : printing.idType === 'bform' ? (printing as any).bformNumber || '—' : printing.cnic || '—'}
                      </td>
                    </tr>
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold">رابطہ نمبر:</td>
                      <td className="py-2 text-left">{printing.contact || '—'}</td>
                    </tr>
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold">حیثیت:</td>
                      <td className="py-2 text-left">{printing.statusType || '—'}</td>
                    </tr>
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold">تعلیمی حیثیت:</td>
                      <td className="py-2 text-left">
                        {printing.category === 'Wafaq' ? 'وفاقی' : printing.category === 'Non-Wafaq' ? 'غیر وفاقی' : (printing.category || '—')}
                      </td>
                    </tr>
                    <tr className="border-b border-dotted border-gray-300">
                      <td className="py-2 text-emerald-700 font-semibold">عمر:</td>
                      <td className="py-2 text-left">{printing.age || '—'}</td>
                    </tr>
                    {printing.currentAddress && (
                      <tr className="border-b border-dotted border-gray-300">
                        <td className="py-2 text-emerald-700 font-semibold">موجودہ پتہ:</td>
                        <td className="py-2 text-left">{printing.currentAddress}</td>
                      </tr>
                    )}
                    {printing.permanentAddress && (
                      <tr>
                        <td className="py-2 text-emerald-700 font-semibold">مستقل پتہ:</td>
                        <td className="py-2 text-left">{printing.permanentAddress}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleThermalPrint}>
                  <Printer className="h-4 w-4 ml-2" />
                  پرنٹ کریں
                </Button>
                <Button className="flex-1" variant="outline" onClick={closePrint}>
                  منسوخ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Token Dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && closeView()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>ٹوکن کی تفصیلات</DialogTitle>
            <DialogDescription>
              جاری کردہ ٹوکن کی مکمل معلومات
            </DialogDescription>
          </DialogHeader>

          {viewing && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                {viewing.photoUrl && (
                  <img
                    src={viewing.photoUrl}
                    alt={viewing.studentName}
                    className="w-20 h-28 object-cover rounded-sm border-2 border-primary bg-white"
                  />
                )}
                <div>
                  <p className="text-2xl font-bold text-primary">{viewing.tokenNumber}</p>
                  <StatusBadge status={viewing.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">نام</Label>
                  <p className="font-semibold">{viewing.studentName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">والد کا نام</Label>
                  <p className="font-semibold">{viewing.fatherName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">درجہ</Label>
                  <p className="font-semibold">{viewing.class}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">تاریخ اجراء</Label>
                  <p className="font-semibold">{viewing.issueDate}</p>
                </div>
                {viewing.testDate && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">انٹری ٹیسٹ کی تاریخ</Label>
                  <p className="font-semibold text-blue-600">{viewing.testDate}</p>
                </div>
                )}
                {viewing.resultDate && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">نتیجے کی تاریخ</Label>
                  <p className="font-semibold text-green-600">{viewing.resultDate}</p>
                </div>
                )}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    {viewing.idType === 'passport' ? 'پاسپورٹ نمبر' : viewing.idType === 'bform' ? 'بی فارم نمبر' : 'شناختی کارڈ نمبر'}
                  </Label>
                  <p className="font-semibold">
                    {viewing.idType === 'passport' ? viewing.passportNumber || "—" : viewing.idType === 'bform' ? (viewing as any).bformNumber || "—" : viewing.cnic || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">رابطہ نمبر</Label>
                  <p className="font-semibold">{viewing.contact || "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">تعلیمی حیثیت</Label>
                  <p className="font-semibold">
                    {viewing.category === 'Wafaq' ? 'وفاقی' : viewing.category === 'Non-Wafaq' ? 'غیر وفاقی' : (viewing.category || "—")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">حیثیت</Label>
                  <p className="font-semibold">{viewing.statusType || "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">عمر</Label>
                  <p className="font-semibold">{viewing.age || "—"}</p>
                </div>
              </div>

              {(viewing.currentAddress || viewing.permanentAddress) && (
                <div className="space-y-2 pt-2 border-t">
                  {viewing.currentAddress && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">موجودہ پتہ</Label>
                      <p>{viewing.currentAddress}</p>
                    </div>
                  )}
                  {viewing.permanentAddress && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">مستقل پتہ</Label>
                      <p>{viewing.permanentAddress}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" variant="outline" onClick={closeView}>
                  بند کریں
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
