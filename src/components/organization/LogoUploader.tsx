import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageCropDialog } from "@/components/media/ImageCropDialog";

interface LogoUploaderProps {
  orgId: string;
  onUploaded?: (publicUrl: string) => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ orgId, onUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onPick = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setCropOpen(true);
  };

  const handleCropped = async (blob: Blob) => {
    try {
      setUploading(true);
      const path = `${orgId}/logo.png`;
      const { error } = await supabase.storage.from("branding").upload(path, blob, { upsert: true, contentType: "image/png" });
      if (error) throw error;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      onUploaded?.(publicUrl);
      toast({ title: "Logo updated", description: "Organization logo has been uploaded." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Upload failed", description: e.message ?? "Unable to upload logo.", variant: "destructive" });
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      <Button variant="secondary" onClick={onPick} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Logo"}
      </Button>
      <ImageCropDialog open={cropOpen} onOpenChange={setCropOpen} file={selectedFile} aspect={1} onCropped={handleCropped} />
    </div>
  );
};
