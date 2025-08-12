import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageCropDialog } from "@/components/media/ImageCropDialog";
import { useAuth } from "@/hooks/useAuth";

interface AvatarUploaderProps {
  onUploaded?: (publicUrl: string) => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ onUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth() as any;

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
    if (!user) {
      toast({ title: "Not signed in", description: "Please sign in to upload an avatar.", variant: "destructive" });
      return;
    }
    try {
      setUploading(true);
      const path = `${user.id}/avatar.png`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/png" });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      // Persisting the URL in a profile table can be added if available in your schema.
      onUploaded?.(publicUrl);
      toast({ title: "Avatar updated", description: "Your profile picture has been uploaded." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Upload failed", description: e.message ?? "Unable to upload avatar.", variant: "destructive" });
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      <Button variant="secondary" onClick={onPick} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Avatar"}
      </Button>
      <ImageCropDialog open={cropOpen} onOpenChange={setCropOpen} file={selectedFile} aspect={1} onCropped={handleCropped} />
    </div>
  );
};
