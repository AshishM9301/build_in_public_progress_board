import { useState } from "react";
import { toast } from "sonner";

export interface ImageData {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  uploadedAt: Date;
  file: File; // Keep the original file for S3 upload
}

export function useImageUpload(projectId: string) {
  const [uploadedImage, setUploadedImage] = useState<ImageData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error("File size too large. Maximum size is 10MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate processing delay
      setUploadProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get image dimensions
      let width: number | undefined;
      let height: number | undefined;

      if (file.type.startsWith("image/")) {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
          img.onload = () => {
            width = img.naturalWidth;
            height = img.naturalHeight;
            URL.revokeObjectURL(objectUrl);
            resolve(true);
          };
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Failed to load image"));
          };
          img.src = objectUrl;
        });
      }

      // Create image data with local blob URL for preview
      const imageData: ImageData = {
        url: URL.createObjectURL(file), // Local blob URL for immediate preview
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        width: width,
        height: height,
        uploadedAt: new Date(),
        file: file, // Store the original file for S3 upload later
      };

      setUploadedImage(imageData);
      setUploadProgress(100);
      toast.success("Image selected successfully!");

      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 1000);

    } catch (error) {
      console.error("File processing failed:", error);
      toast.error("Failed to process image file");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    if (uploadedImage?.url && uploadedImage.url.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedImage.url);
    }
    setUploadedImage(null);
    setUploadProgress(0);
  };

  const resetUpload = () => {
    if (uploadedImage?.url && uploadedImage.url.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedImage.url);
    }
    setUploadedImage(null);
    setIsUploading(false);
    setUploadProgress(0);
  };

  return {
    uploadedImage,
    isUploading,
    uploadProgress,
    handleFileSelect,
    removeImage,
    resetUpload,
  };
}
