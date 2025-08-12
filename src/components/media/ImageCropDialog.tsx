import React, { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  aspect?: number;
  onCropped: (blob: Blob) => void;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, crop: { x: number; y: number; width: number; height: number }, rotation = 0): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  const safeArea = Math.max(image.width, image.height) * 2;
  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width = crop.width;
  canvas.height = crop.height;
  ctx.putImageData(
    data,
    Math.round(0 - (safeArea / 2 - image.width / 2) - crop.x),
    Math.round(0 - (safeArea / 2 - image.height / 2) - crop.y)
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/png", 1);
  });
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({ open, onOpenChange, file, aspect = 1, onCropped }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setImageUrl(url);
    } else {
      setImageUrl(null);
    }
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [file]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageUrl || !croppedAreaPixels) return;
    // convert pixels to percentage-based object for getCroppedImg helper
    const blob = await getCroppedImg(imageUrl, croppedAreaPixels, 0);
    onCropped(blob);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[320px] bg-muted rounded-md overflow-hidden">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
