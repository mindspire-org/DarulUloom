import { useState } from "react";
import { Camera, Loader2, Scan } from "lucide-react";
import { createWorker } from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface IDCardScannerProps {
  onScanComplete: (data: {
    name?: string;
    fatherName?: string;
    cnic?: string;
    dateOfBirth?: string;
  }) => void;
}

export function IDCardScanner({ onScanComplete }: IDCardScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const processImage = async (imageSrc: string) => {
    setScanning(true);
    setProgress(0);
    try {
      const worker = await createWorker('eng+urd', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.floor(m.progress * 100));
          }
        }
      });

      const { data: { text } } = await worker.recognize(imageSrc);
      await worker.terminate();

      console.log("Extracted Text:", text);

      // Simple regex-based extraction (can be improved based on actual card format)
      const data: any = {};
      
      // Clean up the text
      let cleanText = String(text || "")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      // Extract CNIC (Format: 12345-1234567-1)
      const cnicMatch = cleanText.match(/\d{5}-\d{7}-\d{1}/);
      if (cnicMatch) data.cnic = cnicMatch[0];

      // Improved Name and Father Name Extraction
      const skipWords = [
        'pakistan', 'identity', 'card', 'islamic', 'republic', 'national', 'authority', 'nadra', 
        'محکمہ', 'حکومت', 'cnic', 'smart', 'card', 'expire', 'valid', 'from', 'to', 'holder', 
        'signature', 'date of issue', 'menbity', 'menbitv', 'identitv', 'identitv', 'identit',
        'date of birth', 'gender', 'country of stay', 'stay', 'pakistani', 'nadra pak'
      ];

      const meaningfulLines = lines.filter(line => {
        const low = line.toLowerCase().trim();
        if (skipWords.some(w => low.includes(w))) return false;
        if (line.match(/^\d{2}[./-]\d{2}[./-]\d{4}/)) return false; // Date
        if (line.match(/^\d{5}-\d{7}-\d/)) return false; // CNIC
        if (line.match(/\d{13}/)) return false; // Raw CNIC
        if (line.length < 3) return false;
        if ((line.match(/[^a-zA-Z\s\u0600-\u06FF]/g) || []).length > line.length * 0.3) return false;
        return true;
      });

      if (meaningfulLines.length > 0) data.name = meaningfulLines[0];
      if (meaningfulLines.length > 1) data.fatherName = meaningfulLines[1];

      // Look for Date of Birth (Format: DD.MM.YYYY)
      const dobMatch = cleanText.match(/\d{2}\.\d{2}\.\d{4}/);
      if (dobMatch) data.dateOfBirth = dobMatch[0].split('.').reverse().join('-');

      onScanComplete(data);
      toast.success("شناختی کارڈ اسکین ہو گیا");
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("شناختی کارڈ سے ڈیٹا نہیں نکالا جا سکا");
    } finally {
      setScanning(false);
      setProgress(0);
    }
  };

  const handleCapture = async () => {
    // In a real scenario, we would trigger the camera capture here
    // For this implementation, we assume the image is passed from the parent or 
    // we use a simpler approach since CameraCapture already exists.
    toast.info("براہ کرم پہلے تصویر لیں اور پھر اسکین کریں");
  };

  return (
    <div className="space-y-4">
      {scanning && (
        <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm font-medium">ڈیٹا نکالا جا رہا ہے... {progress}%</p>
        </div>
      )}
    </div>
  );
}
