"use client";

import { useEffect, useState } from "react";

type ImageUploadPreviewProps = {
  inputId: string;
  inputName: string;
};

export function ImageUploadPreview({ inputId, inputName }: ImageUploadPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewUrl(null);
      setFileName("");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
  }

  return (
    <div>
      <div className={`poster-preview ${previewUrl ? "has-image" : ""}`}>
        {previewUrl ? <img alt="Selected event poster preview" src={previewUrl} /> : <span>^</span>}
      </div>
      <p>
        Drag and drop your event poster or upload from your device. You can also{" "}
        <label htmlFor={inputId}>browse</label> and keep an external image URL as a fallback.
      </p>
      <input accept="image/*" id={inputId} name={inputName} onChange={handleFileChange} type="file" />
      <p className="muted upload-file-meta">
        {fileName ? `Selected: ${fileName}` : "JPG, PNG, GIF, or WebP up to 5 MB. Files are uploaded to Supabase Storage."}
      </p>
    </div>
  );
}
