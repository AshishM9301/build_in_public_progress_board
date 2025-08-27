import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

// Input validation schemas
const getPresignedUrlSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  contentType: z.string().min(1, "Content type is required"),
  fileSize: z.number().min(1, "File size must be greater than 0"),
  projectId: z.string().min(1, "Project ID is required"),
});

const confirmUploadSchema = z.object({
  key: z.string().min(1, "S3 key is required"),
  url: z.string().url("Valid URL is required"),
  metadata: z.object({
    filename: z.string(),
    size: z.number(),
    mimeType: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
  projectId: z.string(),
});

export const uploadRouter = createTRPCRouter({
  // Get presigned URL for direct S3 upload
  getPresignedUrl: privateProcedure
    .input(getPresignedUrlSchema)
    .mutation(async ({ ctx, input }) => {
      const { filename, contentType, fileSize, projectId } = input;
      const userId = ctx.user.id;

      // Verify project ownership
      const project = await ctx.db.project.findFirst({
        where: { id: projectId, userId, isActive: true },
      });

      if (!project) {
        throw new Error("Project not found or inactive");
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(contentType)) {
        throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed");
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (fileSize > maxSize) {
        throw new Error("File size too large. Maximum size is 10MB");
      }

      // Generate unique S3 key
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `progress-images/${userId}/${projectId}/${timestamp}-${sanitizedFilename}`;

      // For now, return a mock presigned URL structure
      // In production, you would integrate with AWS SDK to generate actual presigned URLs
      const mockPresignedUrl = `https://your-s3-bucket.s3.amazonaws.com/${key}`;
      
      return {
        success: true,
        presignedUrl: mockPresignedUrl,
        key,
        fields: {
          key,
          "Content-Type": contentType,
          // Add other required fields for S3 upload
        },
      };
    }),

  // Confirm successful upload and store metadata
  confirmUpload: privateProcedure
    .input(confirmUploadSchema)
    .mutation(async ({ ctx, input }) => {
      const { key, url, metadata, projectId } = input;
      const userId = ctx.user.id;

      // Verify project ownership
      const project = await ctx.db.project.findFirst({
        where: { id: projectId, userId, isActive: true },
      });

      if (!project) {
        throw new Error("Project not found or inactive");
      }

      // Store image metadata (this will be used when creating the progress post)
      // For now, we'll return success - the actual metadata will be stored with the progress post
      return {
        success: true,
        message: "Upload confirmed successfully",
        imageData: {
          key,
          url,
          ...metadata,
          uploadedAt: new Date(),
        },
      };
    }),
});
