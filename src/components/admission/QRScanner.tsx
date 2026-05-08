import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const qrCodeRegionId = "qr-reader";

    useEffect(() => {
        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode(qrCodeRegionId);
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText) => {
                        toast.success("QR کوڈ کامیابی سے اسکین ہوا");
                        onScan(decodedText);
                        stopScanner();
                    },
                    (errorMessage) => {
                        // Ignore scanning errors (they happen continuously)
                    }
                );

                setIsScanning(true);
            } catch (err) {
                console.error("QR Scanner Error:", err);
                toast.error("QR اسکینر شروع نہیں ہو سکا");
            }
        };

        startScanner();

        return () => {
            stopScanner();
        };
    }, []);

    const stopScanner = () => {
        if (scannerRef.current && isScanning) {
            scannerRef.current
                .stop()
                .then(() => {
                    scannerRef.current?.clear();
                    setIsScanning(false);
                })
                .catch((err) => {
                    console.error("Error stopping scanner:", err);
                });
        }
    };

    const handleClose = () => {
        stopScanner();
        onClose();
    };

    return (
        <Card className="border-primary/50 shadow-lg">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <QrCode className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">QR کوڈ اسکین کریں</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div
                        id={qrCodeRegionId}
                        className="w-full rounded-lg overflow-hidden"
                    />

                    <p className="text-sm text-center text-muted-foreground">
                        QR کوڈ کو کیمرے کے سامنے رکھیں
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
