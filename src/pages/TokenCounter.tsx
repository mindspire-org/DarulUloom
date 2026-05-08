import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Ticket, Search, Loader2, Scan, X, Check } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CameraCapture } from "@/components/admission/CameraCapture";
import { ThermalSlip } from "@/components/admission/ThermalSlip";
import { tokensAPI, studentsAPI, gradesAPI, toAbsoluteAssetUrl } from "@/lib/api";
import { toast } from "sonner";
import { createWorker } from "tesseract.js";
import { useAuth } from "@/contexts/AuthContext";
import { TokenRecord } from "@/contexts/TokenContext";

interface TokenData {
  tokenNumber: string;
  studentName: string;
  fatherName: string;
  dateOfBirth: string;
  age: string;
  currentAddress: string;
  permanentAddress: string;
  cnic: string;
  passportNumber?: string; // Added passport number
  bformNumber?: string; // Added B-Form number
  idType: "cnic" | "passport" | "bform"; // Added ID type
  contact: string;
  class: string;
  category: string;
  statusType: string; // Added statusType
  residency: string;
  photoUrl: string;
  issueDate: string;
  testDate?: string;
  resultDate?: string;
  hostelId?: string;
  hostelName?: string;
  roomNumber?: string;
  bedNumber?: string;
  feeStatus?: "paid" | "pending";
  feeAmount?: number;
}

export default function TokenCounter() {
  const { logout } = useAuth();
  const location = useLocation();
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    fatherName: "",
    dateOfBirth: "",
    age: "",
    currentAddress: "",
    permanentAddress: "",
    cnic: "",
    passportNumber: "", // Added passport number
    bformNumber: "", // Added B-Form number
    idType: "cnic", // Default to CNIC
    contact: "",
    class: [] as string[],
    category: "",
    statusType: "جدید", // Default to 'جدید'
    residency: "مقیم", // Default residency
  });
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [editTokenId, setEditTokenId] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<TokenData | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [searchingCnic, setSearchingCnic] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [remarksData, setRemarksData] = useState<{
    studentName: string;
    fatherName: string;
    remarks: string;
    tokenNumber?: string;
  } | null>(null);
  const [showRemarksDialog, setShowRemarksDialog] = useState(false);
  const [lastSearchedName, setLastSearchedName] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const remarksSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load edit token data if coming from TokenManagement
  useEffect(() => {
    const editToken = location.state?.editToken as TokenRecord | undefined;
    if (editToken) {
      setEditTokenId(editToken.id);
      setFormData({
        studentName: editToken.studentName || "",
        fatherName: editToken.fatherName || "",
        dateOfBirth: editToken.dateOfBirth || "",
        age: editToken.age || "",
        currentAddress: editToken.currentAddress || "",
        permanentAddress: editToken.permanentAddress || "",
        cnic: editToken.cnic || "",
        passportNumber: editToken.passportNumber || "",
        bformNumber: editToken.bformNumber || "",
        idType: editToken.idType || "cnic",
        contact: editToken.contact || "",
        class: editToken.class ? editToken.class.split(", ").filter(Boolean) : [],
        category: editToken.category || "",
        statusType: editToken.statusType || "جدید",
        residency: "مقیم",
      });
      
      if (editToken.photoUrl) {
        setPhotoUrl(toAbsoluteAssetUrl(editToken.photoUrl));
      }
      
      toast.success("ٹوکن کا ڈیٹا لوڈ ہو گیا، اب آپ اس میں ترمیم کر سکتے ہیں");
      
      // Clear the state so refresh doesn't reload the same data
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "q") {
        e.preventDefault();
        setShowClosedModal(true);
        // Close modal after 30 seconds and stay on same page
        setTimeout(() => {
          setShowClosedModal(false);
        }, 30000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await gradesAPI.getAll();
        if (!alive) return;
        const rows = (res.data.data ?? []) as any[];
        const names = rows
          .map((g) => String(g?.name || "").trim())
          .filter(Boolean);
        setClasses(names);
      } catch (err) {
        console.error("Grades load failed:", err);
        toast.error("درجات لوڈ نہیں ہو سکیں");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const dataUrlToFile = (dataUrl: string, filename: string) => {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0]?.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1] || "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handlePhotoCapture = (imageSrc: string) => {
    setPhotoUrl(imageSrc);
  };

  const handleScanIDCard = async () => {
    if (!photoUrl) {
      toast.error("براہ کرم پہلے تصویر لیں");
      return;
    }

    setScanning(true);
    setScanProgress(0);
    try {
      const worker = await createWorker('eng+urd', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.floor(m.progress * 100));
          }
        }
      });

      const { data: { text } } = await worker.recognize(photoUrl);
      await worker.terminate();

      console.log("Raw OCR Text:", text);

      // Clean up the text
      let cleanText = String(text || "")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      // Handle reversed text (Pakistani ID cards often have mirrored text)
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      console.log("Lines:", lines);

      const extractedData: Record<string, string> = {};

      // Extract CNIC - multiple patterns
      const cnicPatterns = [
        /(\d{5}-\d{7}-\d)/,
        /(\d{13})/,
        /(\d{5}\s*-\s*\d{7}\s*-\s*\d)/,
      ];
      
      for (const pattern of cnicPatterns) {
        const match = cleanText.match(pattern);
        if (match) {
          let cnic = match[1].replace(/\s/g, '');
          if (cnic.length === 13) {
            cnic = `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
          }
          extractedData.cnic = cnic;
          extractedData.idType = "cnic"; // Set ID type to cnic
          console.log("Found CNIC:", cnic);
          break;
        }
      }

      // Extract Passport Number - common patterns
      const passportPatterns = [
        /[A-Z]{1,2}\d{6,7}/, // e.g., AB1234567, A123456
        /\d{7}[A-Z]{1}/,    // e.g., 1234567A
      ];

      for (const pattern of passportPatterns) {
        const match = cleanText.match(pattern);
        if (match) {
          extractedData.passportNumber = match[0].trim();
          extractedData.idType = "passport"; // Set ID type to passport
          console.log("Found Passport Number:", extractedData.passportNumber);
          break;
        }
      }

      // Extract Date of Birth - multiple formats
      const dobPatterns = [
        { pattern: /(\d{2})\.(\d{2})\.(\d{4})/, format: 'dd.mm.yyyy' },
        { pattern: /(\d{2})\/(\d{2})\/(\d{4})/, format: 'dd/mm/yyyy' },
        { pattern: /(\d{2})-(\d{2})-(\d{4})/, format: 'dd-mm-yyyy' },
        { pattern: /(\d{4})-(\d{2})-(\d{2})/, format: 'yyyy-mm-dd' },
      ];

      for (const { pattern } of dobPatterns) {
        const match = cleanText.match(pattern);
        if (match) {
          let yyyy, mm, dd;
          if (match[0].includes(match[3]) && parseInt(match[3]) > 1900) {
            dd = match[1];
            mm = match[2];
            yyyy = match[3];
          } else if (parseInt(match[1]) > 1900) {
            yyyy = match[1];
            mm = match[2];
            dd = match[3];
          } else {
            dd = match[1];
            mm = match[2];
            yyyy = match[3];
          }
          const dob = `${yyyy}-${mm}-${dd}`;
          extractedData.dateOfBirth = dob;
          extractedData.age = calculateAge(dob);
          console.log("Found DOB:", dob);
          break;
        }
      }

      // Extract Name and Father Name using multiple strategies
      // Strategy 1: Look for explicit labels
      const nameLabels = ['Name', 'نام', 'Nane', 'Neme', 'Name:', 'نام:'];
      const fatherLabels = ["Father's Name", 'Father Name', 'S/O', 'S/O.', 'والد', 'والد کا نام', 'Father', 'Father:', 'والد:', 'والد کا نام:'];

      // Strategy 2: Improved parsing for Pakistani ID cards
      // Pakistani ID cards usually have Name, then Father Name below it
      const skipWords = [
        'pakistan', 'identity', 'card', 'islamic', 'republic', 'national', 'authority', 'nadra', 
        'محکمہ', 'حکومت', 'cnic', 'smart', 'card', 'expire', 'valid', 'from', 'to', 'holder', 
        'signature', 'date of issue', 'menbity', 'menbitv', 'identitv', 'identit',
        'date of birth', 'gender', 'country of stay', 'stay', 'pakistani', 'nadra pak',
        'government', 'republic', 'authority', 'card'
      ];

      const meaningfulLines = lines.filter(line => {
        const low = line.toLowerCase().trim();
        // Skip header and system words
        if (skipWords.some(w => low.includes(w))) return false;
        
        // Skip dates, numbers and short junk
        if (line.match(/^\d{2}[./-]\d{2}[./-]\d{4}/)) return false; // Date
        if (line.match(/^\d{5}-\d{7}-\d/)) return false; // CNIC
        if (line.match(/\d{13}/)) return false; // Raw CNIC
        if (line.length < 3) return false; // Too short to be a full name
        
        // Skip lines that are mostly special characters or numbers
        if ((line.match(/[^a-zA-Z\s\u0600-\u06FF]/g) || []).length > line.length * 0.3) return false;
        
        // Skip common OCR noise patterns
        const junkPatterns = [
          /^[|\\/_\[\]{}<>!@#$%^&*()]+$/, // Only symbols
          /^[a-z]{1,4}$/i, // Very short letters (often noise)
          /[0-9]{5,}/, // Long numbers (not CNIC which is handled above)
        ];
        if (junkPatterns.some(p => p.test(line))) return false;

        // Skip pure Urdu labels that aren't followed by text
        const pureLabels = ['نام', 'والد', 'والد کا نام', 'نام:', 'والد:', 'والد کا نام:'];
        if (pureLabels.includes(line)) return false;
        
        return true;
      });

      console.log("Meaningful lines:", meaningfulLines);

      // Try to find Name and Father Name with better priority
      let foundName = "";
      let foundFather = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const low = line.toLowerCase().trim();

        // 1. Look for Name label
        if (nameLabels.some(label => low.includes(label.toLowerCase())) && !low.includes('father')) {
          // Check same line after label
          let afterLabel = "";
          for (const label of nameLabels) {
            if (low.includes(label.toLowerCase())) {
              afterLabel = line.split(new RegExp(label, 'i'))[1]?.replace(/[:\s]+/, '').trim();
              break;
            }
          }

          if (afterLabel && afterLabel.length > 3) {
            foundName = afterLabel;
          } else if (i + 1 < lines.length) {
            // Check next line if same line is empty
            const nextLine = lines[i+1].trim();
            if (nextLine.length > 3 && !skipWords.some(w => nextLine.toLowerCase().includes(w))) {
              foundName = nextLine;
            }
          }
        }

        // 2. Look for Father Name label
        if (fatherLabels.some(label => low.includes(label.toLowerCase())) || low.includes('s/o') || low.includes('d/o')) {
          let afterLabel = "";
          let foundLabel = "";
          if (low.includes('s/o')) foundLabel = 's/o';
          else if (low.includes('d/o')) foundLabel = 'd/o';
          else {
            for (const label of fatherLabels) {
              if (low.includes(label.toLowerCase())) {
                foundLabel = label;
                break;
              }
            }
          }

          if (foundLabel) {
            afterLabel = line.split(new RegExp(foundLabel, 'i'))[1]?.replace(/[:\s.']+/g, '').trim();
          }

          if (afterLabel && afterLabel.length > 3) {
            foundFather = afterLabel;
          } else if (i + 1 < lines.length) {
            const nextLine = lines[i+1].trim();
            if (nextLine.length > 3 && !skipWords.some(w => nextLine.toLowerCase().includes(w))) {
              foundFather = nextLine;
            }
          }
        }
      }

      // Final Strategy: If still missing, use filtered meaningful lines intelligently
      // Usually, the first meaningful line is Name, second is Father Name on CNIC
      if (!foundName && meaningfulLines.length > 0) {
        foundName = meaningfulLines[0];
      }
      if (!foundFather && meaningfulLines.length > 1) {
        // If we picked the same line for name, try next
        if (foundName === meaningfulLines[0]) {
          foundFather = meaningfulLines[1];
        } else {
          foundFather = meaningfulLines[0];
        }
      } else if (!foundFather && foundName && meaningfulLines.length > 0) {
        const remaining = meaningfulLines.filter(l => l !== foundName);
        if (remaining.length > 0) foundFather = remaining[0];
      }

      extractedData.studentName = foundName;
      extractedData.fatherName = foundFather;

      // Final cleanup: Remove mirrored or garbage characters
      const cleanName = (name: string) => {
        if (!name) return "";
        return name
          .replace(/^[^\w\u0600-\u06FF]+/, '') // Remove leading non-word chars
          .replace(/[|\\/_\[\]{}<>]+/, '') // Remove OCR noise
          .replace(/\s+/g, ' ')
          .trim();
      };

      if (extractedData.studentName) extractedData.studentName = cleanName(extractedData.studentName);
      if (extractedData.fatherName) extractedData.fatherName = cleanName(extractedData.fatherName);

      console.log("Final extracted data:", extractedData);

      // Update form
      setFormData((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(extractedData).filter(([, v]) => v && String(v).trim() !== "")
        ),
        idType: extractedData.idType || prev.idType, // Ensure idType is updated
      }));

      const extractedCount = Object.keys(extractedData).filter(k => extractedData[k]).length;
      if (extractedCount > 0) {
        toast.success(`${extractedCount} فیلڈز نکال لی گئیں`);
      } else {
        toast.warning("کچھ فیلڈز نہیں نکال سکے، براہ کرم دستی درج کریں");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("ڈیٹا نکالنے میں دشواری پیش آئی");
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  };

  // Search for remarks when name and father name are filled
  useEffect(() => {
    const name = formData.studentName.trim();
    const father = formData.fatherName.trim();
    const currentSearch = `${name}|${father}`;

    if (name.length > 2 && father.length > 2 && currentSearch !== lastSearchedName) {
      if (remarksSearchTimeoutRef.current) {
        clearTimeout(remarksSearchTimeoutRef.current);
      }

      remarksSearchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await studentsAPI.searchByName(name, father);
          const data = res.data.data;

          if (data && data.remarks) {
            setRemarksData({
              studentName: data.studentName,
              fatherName: data.fatherName,
              remarks: data.remarks,
              tokenNumber: data.tokenNumber,
            });
            setShowRemarksDialog(true);
            setLastSearchedName(currentSearch);
          }
        } catch (err) {
          console.error("Remarks search error:", err);
        }
      }, 800);
    }

    return () => {
      if (remarksSearchTimeoutRef.current) {
        clearTimeout(remarksSearchTimeoutRef.current);
      }
    };
  }, [formData.studentName, formData.fatherName, lastSearchedName]);

  const toggleClass = (cls: string) => {
    setFormData((prev) => {
      const currentClasses = prev.class as string[];
      if (currentClasses.includes(cls)) {
        return { ...prev, class: currentClasses.filter((c) => c !== cls) };
      } else {
        return { ...prev, class: [...currentClasses, cls] };
      }
    });
  };

  const removeClass = (cls: string) => {
    setFormData((prev) => ({
      ...prev,
      class: (prev.class as string[]).filter((c) => c !== cls),
    }));
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return "";
    try {
      const dob = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age >= 0 ? age.toString() : "0";
    } catch (err) {
      console.error("Age calculation failed:", err);
      return "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentName) {
      toast.error("طالب علم کا نام درج کریں");
      return;
    }
    if (!formData.fatherName) {
      toast.error("والد کا نام درج کریں");
      return;
    }
    if (!formData.dateOfBirth) {
      toast.error("تاریخ پیدائش درج کریں");
      return;
    }
    if (!formData.age) {
      toast.error("عمر درج کریں");
      return;
    }
    if (!formData.currentAddress && !formData.permanentAddress) {
      toast.error("موجودہ پتہ یا مستقل پتہ میں سے ایک لازمی ہے");
      return;
    }
    if (formData.idType === "cnic" && !formData.cnic) {
      toast.error("شناختی کارڈ نمبر درج کریں");
      return;
    }
    if (formData.idType === "passport" && !formData.passportNumber) {
      toast.error("پاسپورٹ نمبر درج کریں");
      return;
    }
    if (formData.idType === "bform" && !formData.bformNumber) {
      toast.error("بی فارم نمبر درج کریں");
      return;
    }
    if (!formData.contact) {
      toast.error("رابطہ نمبر درج کریں");
      return;
    }
    if (!formData.class || (formData.class as string[]).length === 0) {
      toast.error("درجہ منتخب کریں");
      return;
    }
    if (!formData.statusType) {
      toast.error("حیثیت منتخب کریں");
      return;
    }
    if (!formData.category) {
      toast.error("تعلیمی حیثیت منتخب کریں");
      return;
    }
    if (!photoUrl) {
      toast.error("براہ کرم تصویر لیں");
      return;
    }

    (async () => {
      try {
        const fd = new FormData();
        fd.append("studentName", formData.studentName);
        fd.append("fatherName", formData.fatherName);
        fd.append("dateOfBirth", formData.dateOfBirth);
        fd.append("age", formData.age);
      fd.append("currentAddress", formData.currentAddress);
      fd.append("permanentAddress", formData.permanentAddress);
      fd.append("cnic", formData.cnic);
      fd.append("passportNumber", formData.passportNumber); // Append passport number
      fd.append("bformNumber", formData.bformNumber); // Append B-Form number
      fd.append("idType", formData.idType); // Append ID type
      fd.append("contact", formData.contact);
      fd.append("class", (formData.class as string[]).join(", "));
      fd.append("statusType", formData.statusType);
      fd.append("category", formData.category);
      fd.append("residency", formData.residency);

      const photoFile = dataUrlToFile(photoUrl, `photo-${Date.now()}.jpg`);
      fd.append("photo", photoFile);

      let res;
      if (editTokenId) {
        // Update existing token (using JSON if only text, FormData if photo changed)
        // Since we have a photo, we use FormData for update too
        res = await tokensAPI.updateMy(editTokenId, fd);
        toast.success("ٹوکن کامیابی سے اپ ڈیٹ ہو گیا");
      } else {
        // Create new token
        res = await tokensAPI.create(fd);
        toast.success("ٹوکن کامیابی سے جاری ہو گیا");
      }
        
        const s = res.data.data;

        // Calculate dates with validation
        let issueDate;
        if (s?.createdAt) {
          try {
            const date = new Date(s.createdAt);
            issueDate = isNaN(date.getTime()) 
              ? new Date().toLocaleDateString("ur-PK")
              : date.toLocaleDateString("ur-PK");
          } catch (e) {
            issueDate = new Date().toLocaleDateString("ur-PK");
          }
        } else {
          issueDate = new Date().toLocaleDateString("ur-PK");
        }

        let testDate = "";
        if (s?.testDate) {
          try {
            const date = new Date(s.testDate);
            testDate = isNaN(date.getTime()) ? "" : date.toLocaleDateString("ur-PK");
          } catch (e) {
            testDate = "";
          }
        }

        let resultDate = "";
        if (s?.resultDate) {
          try {
            const date = new Date(s.resultDate);
            resultDate = isNaN(date.getTime()) ? "" : date.toLocaleDateString("ur-PK");
          } catch (e) {
            resultDate = "";
          }
        }

        const serverPhotoUrl = toAbsoluteAssetUrl(s?.photoUrl || "");

        setGeneratedToken({
          tokenNumber: s?.tokenNumber || "",
          studentName: s?.studentName || formData.studentName,
          fatherName: s?.fatherName || formData.fatherName,
          dateOfBirth: s?.dateOfBirth || formData.dateOfBirth,
          age: s?.age || formData.age,
          currentAddress: s?.currentAddress || formData.currentAddress,
          permanentAddress: s?.permanentAddress || formData.permanentAddress,
          cnic: s?.cnic || formData.cnic,
          contact: s?.contact || formData.contact,
          class: s?.class || (formData.class as string[]).join(", "),
          statusType: s?.statusType || formData.statusType,
          category: s?.category || formData.category,
          residency: s?.residency || formData.residency,
          photoUrl: serverPhotoUrl || photoUrl,
          idType: s?.idType || formData.idType,
          passportNumber: s?.passportNumber || formData.passportNumber,
          bformNumber: s?.bformNumber || formData.bformNumber,
          issueDate,
          testDate,
          resultDate,
        });

        // Save to localStorage for Verification page
        const newToken: TokenRecord = {
          id: s?._id || editTokenId || Date.now().toString(),
          tokenNumber: s?.tokenNumber || "",
          studentName: s?.studentName || formData.studentName,
          fatherName: s?.fatherName || formData.fatherName,
          class: s?.class || (formData.class as string[]).join(", "),
          issueDate,
          status: s?.status || "pending",
          cnic: s?.cnic || formData.cnic,
          contact: s?.contact || formData.contact,
          statusType: s?.statusType || formData.statusType,
          category: s?.category || formData.category,
          photoUrl: serverPhotoUrl || photoUrl,
          dateOfBirth: s?.dateOfBirth || formData.dateOfBirth,
          age: s?.age || formData.age,
          currentAddress: s?.currentAddress || formData.currentAddress,
          permanentAddress: s?.permanentAddress || formData.permanentAddress,
          testDate,
          resultDate,
          passportNumber: s?.passportNumber || formData.passportNumber,
          bformNumber: s?.bformNumber || formData.bformNumber,
          idType: (s?.idType || formData.idType) as "cnic" | "passport" | "bform",
        };
        
        // Get existing tokens and add/update this one
        const existingTokens = JSON.parse(localStorage.getItem("jamia_tokens_v1") || "[]");
        const tokenIndex = existingTokens.findIndex((t: any) => t.id === newToken.id);
        
        if (tokenIndex >= 0) {
          // Update existing token
          existingTokens[tokenIndex] = { ...existingTokens[tokenIndex], ...newToken };
        } else {
          // Add new token
          existingTokens.unshift(newToken);
        }
        
        console.log("Token saved to localStorage:", newToken);
        localStorage.setItem("jamia_tokens_v1", JSON.stringify(existingTokens));
      } catch (e: any) {
        const serverMsg = e?.response?.data?.message;
        if (serverMsg) {
          console.error("Token create/update failed:", serverMsg, e?.response?.data);
        } else {
          console.error("Token create/update failed:", e);
        }
        toast.error(serverMsg || (editTokenId ? "ٹوکن اپ ڈیٹ نہیں ہو سکا" : "ٹوکن جاری نہیں ہو سکا"));
        
        // Fallback: Save to localStorage even if API fails
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const datePrefix = `${year}${month}${day}`;
        
        // Get existing tokens to find next sequence (global counting)
        const existingTokens = JSON.parse(localStorage.getItem("jamia_tokens_v1") || "[]");
        
        let maxSequence = 0;
        existingTokens.forEach((t: any) => {
          const parts = t.tokenNumber.split('-');
          if (parts.length === 2) {
            const seq = parseInt(parts[1], 10);
            if (!isNaN(seq) && seq > maxSequence) {
              maxSequence = seq;
            }
          }
        });
        
        const nextSequence = String(maxSequence + 1).padStart(4, '0');
        const tokenNumber = `${datePrefix}-${nextSequence}`;
        
        const fallbackToken = {
          id: editTokenId || Date.now().toString(),
          tokenNumber: tokenNumber,
          studentName: formData.studentName,
          fatherName: formData.fatherName,
          class: (formData.class as string[]).join(", "),
          issueDate: new Date().toLocaleDateString("ur-PK"),
          status: "pending",
          cnic: formData.cnic,
          passportNumber: formData.passportNumber,
          bformNumber: formData.bformNumber,
          idType: formData.idType,
          contact: formData.contact,
          statusType: formData.statusType,
          category: formData.category,
          residency: formData.residency,
          photoUrl: photoUrl,
          dateOfBirth: formData.dateOfBirth,
          age: formData.age,
          currentAddress: formData.currentAddress,
          permanentAddress: formData.permanentAddress,
        };
        
        const tokenIndex = existingTokens.findIndex((t: any) => t.id === fallbackToken.id);
        
        if (tokenIndex >= 0) {
          existingTokens[tokenIndex] = { ...existingTokens[tokenIndex], ...fallbackToken };
        } else {
          existingTokens.unshift(fallbackToken);
        }
        
        localStorage.setItem("jamia_tokens_v1", JSON.stringify(existingTokens));
        console.log("Token saved to localStorage (fallback):", fallbackToken);
        toast.error("لوکل اسٹوریج میں محفوظ ہو گیا (API فیل)");
      }
    })();
  };

  const handleReset = () => {
    setFormData({
      studentName: "",
      fatherName: "",
      dateOfBirth: "",
      age: "",
      currentAddress: "",
      permanentAddress: "",
      cnic: "",
      passportNumber: "",
      bformNumber: "",
      idType: "cnic",
      contact: "",
      class: [] as string[],
      statusType: "جدید",
      category: "",
      residency: "مقیم",
    });
    setPhotoUrl("");
    setGeneratedToken(null);
    setEditTokenId(null);
  };

  const handleCnicChange = (value: string) => {
    // Remove all non-digits for formatting
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    
    if (digits.length <= 5) {
      formatted = digits;
    } else if (digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
    
    setFormData({ ...formData, cnic: formatted });

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if CNIC looks complete (13 digits is standard for CNIC)
    if (digits.length >= 13) {
      setSearchingCnic(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await tokensAPI.getByCnic(formatted);
          const data = res.data.data;

          if (data) {
            setFormData(prev => ({
              ...prev,
              studentName: data.studentName || prev.studentName,
              fatherName: data.fatherName || prev.fatherName,
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : prev.dateOfBirth,
              age: data.age || prev.age,
              currentAddress: data.currentAddress || prev.currentAddress,
              permanentAddress: data.permanentAddress || prev.permanentAddress,
              contact: data.contact || prev.contact,
              category: data.category || prev.category,
              residency: data.residency || prev.residency,
            }));

            if (data.photoUrl) {
              setPhotoUrl(toAbsoluteAssetUrl(data.photoUrl));
            }

            toast.success("معلومات خود بخود پُر کر دی گئی ہیں");
          }
        } catch (err: any) {
          if (err.response?.status !== 404) {
            console.error("CNIC search error:", err);
          }
        } finally {
          setSearchingCnic(false);
        }
      }, 500); // Wait 500ms after typing stops
    }
  };

  const handleBFormChange = (value: string) => {
    // Remove all non-digits for formatting
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    
    if (digits.length <= 5) {
      formatted = digits;
    } else if (digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
    
    setFormData({ ...formData, bformNumber: formatted });
  };

  return (
    <DashboardLayout title="ٹوکن کاؤنٹر">
      <PageHeader
        title="نیا ٹوکن جاری کریں"
        description="طالب علم کی معلومات درج کر کے ٹوکن جاری کریں"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                طالب علم کی معلومات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Camera Capture - Moved to top */}
              <div className="relative">
                <CameraCapture
                  onCapture={handlePhotoCapture}
                  capturedImage={photoUrl}
                />
                {photoUrl && (
                  <div className="mt-4">
                    <Button 
                      onClick={handleScanIDCard} 
                      disabled={scanning}
                      className="w-full h-12 gap-2"
                      variant="secondary"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          اسکین ہو رہا ہے... {scanProgress}%
                        </>
                      ) : (
                        <>
                          <Scan className="h-4 w-4" />
                          شناختی کارڈ سے ڈیٹا نکالیں
                        </>
                      )}
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                      تصویر واضح ہونی چاہیے تاکہ ڈیٹا درست طریقے سے نکالا جا سکے
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="studentName">نام</Label>
                  <Input
                    id="studentName"
                    placeholder="طالب علم کا نام"
                    value={formData.studentName}
                    onChange={(e) =>
                      setFormData({ ...formData, studentName: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherName">والد کا نام</Label>
                  <Input
                    id="fatherName"
                    placeholder="والد کا نام"
                    value={formData.fatherName}
                    onChange={(e) =>
                      setFormData({ ...formData, fatherName: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">تاریخ پیدائش</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      const dob = e.target.value;
                      const age = calculateAge(dob);
                      setFormData({ ...formData, dateOfBirth: dob, age });
                    }}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">عمر</Label>
                  <Input
                    id="age"
                    placeholder="مثال: 12"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentAddress">موجودہ پتہ</Label>
                  <Input
                    id="currentAddress"
                    placeholder="موجودہ پتہ"
                    value={formData.currentAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, currentAddress: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permanentAddress">مستقل پتہ</Label>
                  <Input
                    id="permanentAddress"
                    placeholder="مستقل پتہ"
                    value={formData.permanentAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, permanentAddress: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                {/* ID Type Selection */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="idType">ID کی قسم</Label>
                    <Select
                      value={formData.idType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, idType: value as "cnic" | "passport" | "bform" })
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="ID کی قسم منتخب کریں" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cnic">شناختی کارڈ</SelectItem>
                        <SelectItem value="passport">پاسپورٹ</SelectItem>
                        <SelectItem value="bform">بی فارم نمبر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    {formData.idType === "cnic" ? (
                      <div className="relative">
                        <Label htmlFor="cnic">شناختی کارڈ نمبر</Label>
                        <Input
                          id="cnic"
                          placeholder="XXXXX-XXXXXXX-X"
                          value={formData.cnic}
                          onChange={(e) => handleCnicChange(e.target.value)}
                          className="h-12 mt-2"
                        />
                        {searchingCnic && (
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ) : formData.idType === "passport" ? (
                      <div>
                        <Label htmlFor="passportNumber">پاسپورٹ نمبر</Label>
                        <Input
                          id="passportNumber"
                          placeholder="مثال: A1234567"
                          value={formData.passportNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, passportNumber: e.target.value })
                          }
                          className="h-12 mt-2"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="bformNumber">بی فارم نمبر</Label>
                        <Input
                          id="bformNumber"
                          placeholder="XXXXX-XXXXXXX-X"
                          value={formData.bformNumber}
                          onChange={(e) => handleBFormChange(e.target.value)}
                          className="h-12 mt-2"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">رابطہ نمبر</Label>
                  <Input
                    id="contact"
                    placeholder="0300-1234567"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">درجہ (ایک سے زیادہ منتخب کریں)</Label>
                  
                  {/* Selected Classes Badges */}
                  {(formData.class as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(formData.class as string[]).map((cls) => (
                        <span
                          key={cls}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                        >
                          {cls}
                          <button
                            type="button"
                            onClick={() => removeClass(cls)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Class Selection Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowClassDropdown(!showClassDropdown)}
                      className="w-full h-12 px-3 border rounded-md flex items-center justify-between bg-background hover:bg-muted/50 text-right"
                    >
                      <span className="text-muted-foreground">
                        {(formData.class as string[]).length > 0 
                          ? `${(formData.class as string[]).length} درجات منتخب` 
                          : "درجہ منتخب کریں"}
                      </span>
                      <span className="text-muted-foreground">▼</span>
                    </button>
                    
                    {showClassDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {classes.length > 0 ? (
                          classes.map((cls) => {
                            const isSelected = (formData.class as string[]).includes(cls);
                            return (
                              <div
                                key={cls}
                                onClick={() => toggleClass(cls)}
                                className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted ${
                                  isSelected ? "bg-primary/10" : ""
                                }`}
                              >
                                <span>{cls}</span>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            کوئی درجہ دستیاب نہیں
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    ایک یا ایک سے زیادہ درجات منتخب کریں
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusType">حیثیت</Label>
                  <Select
                    value={formData.statusType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, statusType: value })
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="حیثیت منتخب کریں" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="قدیم">قدیم</SelectItem>
                      <SelectItem value="جدید">جدید</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">تعلیمی حیثیت</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="تعلیمی حیثیت منتخب کریں" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wafaq">وفاقی</SelectItem>
                      <SelectItem value="Non-Wafaq">غیر وفاقی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>



                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 h-12 text-lg">
                    {editTokenId ? "ٹوکن اپ ڈیٹ کریں" : "ٹوکن جاری کریں"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12"
                    onClick={handleReset}
                  >
                    صاف کریں
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Token Preview / Thermal Slip */}
        <div>
          {generatedToken ? (
              <ThermalSlip
                tokenNumber={generatedToken.tokenNumber}
                studentName={generatedToken.studentName}
                fatherName={generatedToken.fatherName}
                grade={generatedToken.class}
                date={generatedToken.issueDate}
                contact={generatedToken.contact}
                residency={generatedToken.residency}
                testDate={generatedToken.testDate}
                resultDate={generatedToken.resultDate}
                photoUrl={generatedToken.photoUrl}
                cnic={generatedToken.cnic}
                passportNumber={generatedToken.passportNumber}
                idType={generatedToken.idType}
                category={generatedToken.category}
                statusType={generatedToken.statusType}
              />
          ) : (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>ٹوکن جاری کرنے کے لیے فارم پُر کریں</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Registration Closed Modal */}
      <Dialog open={showClosedModal} onOpenChange={setShowClosedModal}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl text-destructive">بند شدہ رجسٹریشن</DialogTitle>
            <DialogDescription className="text-lg py-4">
              رجسٹریشن بند ہو چکی ہے۔
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Remarks Dialog */}
      <Dialog open={showRemarksDialog} onOpenChange={setShowRemarksDialog}>
        <DialogContent className="sm:max-w-md text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive text-right">طالب علم کی سابقہ کیفیت</DialogTitle>
            <DialogDescription className="text-lg py-2 text-right">
              اس طالب علم کے ریکارڈ میں درج ذیل کیفیت (Remarks) موجود ہیں:
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center border-b border-destructive/10 pb-2">
              <span className="font-bold">نام:</span>
              <span>{remarksData?.studentName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-destructive/10 pb-2">
              <span className="font-bold">ولدیت:</span>
              <span>{remarksData?.fatherName}</span>
            </div>
            {remarksData?.tokenNumber && (
              <div className="flex justify-between items-center border-b border-destructive/10 pb-2">
                <span className="font-bold">ٹوکن نمبر:</span>
                <span className="font-mono">{remarksData?.tokenNumber}</span>
              </div>
            )}
            <div className="pt-2">
              <span className="font-bold block mb-1">کیفیت:</span>
              <p className="text-destructive font-medium leading-relaxed">
                {remarksData?.remarks}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button 
              className="flex-1 h-12 bg-primary hover:bg-primary/90"
              onClick={() => setShowRemarksDialog(false)}
            >
              داخلہ دیں (ٹوکن جاری کریں)
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-12 border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => {
                setShowRemarksDialog(false);
                handleReset();
              }}
            >
              کیفیت کو نظر انداز نہ کریں (منسوخ)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
