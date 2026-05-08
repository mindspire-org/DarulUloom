import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  capturedImage?: string;
}

export function CameraCapture({ onCapture, capturedImage }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(capturedImage || null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const capture = useCallback(() => {
    const canvas = webcamRef.current?.getCanvas();
    if (canvas) {
      // Create a temporary canvas to flip the image back
      const flipCanvas = document.createElement("canvas");
      flipCanvas.width = canvas.width;
      flipCanvas.height = canvas.height;
      const ctx = flipCanvas.getContext("2d");
      
      if (ctx) {
        // Flip horizontally
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(canvas, 0, 0);
        
        const imageSrc = flipCanvas.toDataURL("image/jpeg");
        setImgSrc(imageSrc);
        onCapture(imageSrc);
        toast.success("تصویر کامیابی سے لی گئی");
      }
    }
  }, [webcamRef, onCapture]);

  const retake = () => {
    setImgSrc(null);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            ) : (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                onUserMedia={() => setIsCameraReady(true)}
                onUserMediaError={() => {
                  toast.error("کیمرہ تک رسائی نہیں ہو سکی");
                  setIsCameraReady(false);
                }}
                mirrored={true}
              />
            )}
            
            {!imgSrc && !isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>کیمرہ لوڈ ہو رہا ہے...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {imgSrc ? (
              <>
                <Button
                  onClick={retake}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 ml-2" />
                  دوبارہ لیں
                </Button>
                <Button className="flex-1" disabled>
                  <Check className="h-4 w-4 ml-2" />
                  تصویر محفوظ ہے
                </Button>
              </>
            ) : (
              <Button
                onClick={capture}
                disabled={!isCameraReady}
                className="w-full"
              >
                <Camera className="h-4 w-4 ml-2" />
                تصویر لیں
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
