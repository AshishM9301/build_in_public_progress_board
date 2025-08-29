"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Send, CheckCircle, AlertCircle, Upload, X, Image as ImageIcon, Clipboard, AlertTriangle } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { useImageUpload } from "@/hooks/use-image-upload"
import Image from "next/image"
import { uploadImageToS3 } from "@/lib/s3-upload"


const dailyProgressSchema = z.object({
  projectId: z.string().min(1, "Please select a project"),
  content: z.string()
    .min(10, "Progress update must be at least 10 characters")
    .max(1000, "Progress update too long")
    .refine((content) => !containsSQLInjection(content), {
      message: "Content contains potentially unsafe characters"
    }),
})

// SQL injection detection function
function containsSQLInjection(content: string): boolean {
  const sqlPatterns = [
    /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script|javascript|onload|onerror)\b)/i,
    /(['"];?\s*(select|insert|update|delete|drop|create|alter|exec|execute|union))/i,
    /(\b(union\s+select|select\s+union)\b)/i,
    /(\b(script|javascript|vbscript|expression)\b)/i,
    /(\b(onload|onerror|onclick|onmouseover)\b)/i,
    /(\b(alert|confirm|prompt|eval|setTimeout|setInterval)\b)/i,
    /(\b(document\.|window\.|location\.|history\.)\b)/i,
    /(\b(iframe|object|embed|form|input|textarea)\b)/i,
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(\b(script|javascript|vbscript|expression)\b)/i,
    /(\b(onload|onerror|onclick|onmouseover)\b)/i,
    /(\b(alert|confirm|prompt|eval|setTimeout|setInterval)\b)/i,
    /(\b(document\.|window\.|location\.|history\.)\b)/i,
    /(\b(iframe|object|embed|form|input|textarea)\b)/i,
  ]

  return sqlPatterns.some(pattern => pattern.test(content))
}

type DailyProgressForm = z.infer<typeof dailyProgressSchema>

interface EnhancedDailyProgressFormProps {
  projectId?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // Add edit mode props
  editMode?: boolean
  postId?: string // Add post ID for edit mode
  existingImageUrl?: string
  existingImageData?: {
    filename: string
    size: number
    mimeType: string
    width?: number
    height?: number
  }
  // Add onSuccess callback
  onSuccess?: () => void
}

export function EnhancedDailyProgressForm({
  projectId: initialProjectId,
  trigger,
  open,
  onOpenChange,
  editMode,
  postId,
  existingImageUrl,
  existingImageData,
  onSuccess,
}: EnhancedDailyProgressFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [clipboardError, setClipboardError] = useState<string | null>(null)

  const utils = api.useUtils()

  const { data: projectsData } = api.project.getUserProjects.useQuery()
  const projects = projectsData?.projects ?? []

  // Automatically select the project if projectId is provided
  const selectedProject = initialProjectId
    ? projects.find((p: { id: string }) => p.id === initialProjectId)
    : null

  const { data: todayStatus } = api.progress.getTodayStatus.useQuery(
    { projectId: selectedProject?.id ?? "" },
    { enabled: !!selectedProject?.id }
  )
  const { data: canPostToday } = api.progress.canPostToday.useQuery(
    { projectId: selectedProject?.id ?? "" },
    { enabled: !!selectedProject?.id }
  )

  // Use image upload hook only when we have a selected project
  const {
    uploadedImage,
    isUploading,
    uploadProgress,
    handleFileSelect,
    removeImage,
    resetUpload,

  } = useImageUpload(selectedProject?.id ?? "")

  const createDailyPost = api.progress.createDailyPost.useMutation({
    onSuccess: () => {
      toast.success("Daily progress posted successfully!")
      void utils.progress.getTodayStatus.invalidate()
      void utils.progress.getProgressHistory.invalidate()
      void utils.streak.getStreakStats.invalidate()
      void utils.project.getUserProjects.invalidate()
      // Also invalidate the specific project to refresh the page data
      if (selectedProject?.id) {
        void utils.project.getProject.invalidate({ id: selectedProject.id })
      }
      form.reset()
      resetUpload()
      setIsDialogOpen(false)
      onOpenChange?.(false)
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to post progress")
    },
  })

  const updateDailyPost = api.progress.updateDailyPost.useMutation({
    onSuccess: () => {
      toast.success("Progress updated successfully!")
      void utils.progress.getTodayStatus.invalidate()
      void utils.progress.getProgressHistory.invalidate()
      void utils.streak.getStreakStats.invalidate()
      void utils.project.getUserProjects.invalidate()
      // Also invalidate the specific project to refresh the page data
      if (selectedProject?.id) {
        void utils.project.getProject.invalidate({ id: selectedProject.id })
      }
      form.reset()
      resetUpload()
      setIsDialogOpen(false)
      onOpenChange?.(false)
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update progress")
    },
  })

  const form = useForm<DailyProgressForm>({
    resolver: zodResolver(dailyProgressSchema),
    defaultValues: {
      projectId: initialProjectId ?? "",
      content: "",
    },
  })

  // Ensure projectId is always set when the component mounts or project changes
  useEffect(() => {
    if (initialProjectId) {
      console.log("Setting form projectId to:", initialProjectId)
      form.setValue("projectId", initialProjectId)
    }
  }, [initialProjectId, form])

  // Also set projectId when selectedProject changes
  useEffect(() => {
    if (selectedProject?.id) {
      console.log("Setting form projectId from selectedProject to:", selectedProject.id)
      form.setValue("projectId", selectedProject.id)
    }
  }, [selectedProject, form])

  // Force set projectId if it's still empty after initialization
  useEffect(() => {
    const currentProjectId = form.getValues("projectId")
    if (!currentProjectId && selectedProject?.id) {
      console.log("Force setting projectId in form:", selectedProject.id)
      form.setValue("projectId", selectedProject.id)
    }
  }, [form, selectedProject])

  // Clipboard paste functionality
  const handleClipboardPaste = useCallback(async (e: React.ClipboardEvent) => {
    e.preventDefault()

    try {
      const clipboardData = e.clipboardData

      // Check for image in clipboard
      if (clipboardData?.files?.length > 0) {
        const file = clipboardData?.files?.[0]
        if (file?.type?.startsWith('image/')) {
          void handleFileSelect(file)
          toast.success("Image pasted from clipboard!")
          return
        }
      }

      // Check for text in clipboard
      const text = clipboardData?.getData?.('text/plain')
      if (text?.trim()) {
        // Validate text for SQL injection
        if (containsSQLInjection(text)) {
          setClipboardError("Pasted content contains potentially unsafe characters")
          toast.error("Pasted content contains potentially unsafe characters")
          return
        }

        // Get current content and append pasted text
        const currentContent = form.getValues("content")
        const newContent = currentContent + (currentContent ? "\n\n" : "") + text
        form.setValue("content", newContent)

        setClipboardError(null)
        toast.success("Text pasted from clipboard!")
      }
    } catch (error) {
      console.error("Clipboard paste error:", error)
      toast.error("Failed to paste from clipboard")
    }
  }, [handleFileSelect, form])

  // Global clipboard paste listener when dialog is open
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (!isDialogOpen) return

      try {
        // Check for image in clipboard
        if (e.clipboardData?.files?.length) {
          const file = e.clipboardData?.files?.[0]
          if (file?.type?.startsWith('image/')) {
            void handleFileSelect(file)
            toast.success("Image pasted from clipboard!")
            return
          }
        }

        // Check for text in clipboard
        const text = e.clipboardData?.getData?.('text/plain')
        if (text?.trim()) {
          // Validate text for SQL injection
          if (containsSQLInjection(text)) {
            setClipboardError("Pasted content contains potentially unsafe characters")
            toast.error("Pasted content contains potentially unsafe characters")
            return
          }

          // Get current content and append pasted text
          const currentContent = form.getValues("content")
          const newContent = currentContent + (currentContent ? "\n\n" : "") + text
          form.setValue("content", newContent)

          setClipboardError(null)
          toast.success("Text pasted from clipboard!")
        }
      } catch (err) {
        console.error("Global clipboard paste error:", err)
        toast.error("Failed to paste from clipboard")
      }
    }

    if (isDialogOpen) {
      document.addEventListener('paste', handleGlobalPaste)
    }

    return () => {
      document.removeEventListener('paste', handleGlobalPaste)
    }
  }, [isDialogOpen, handleFileSelect, form])

  const onSubmit = async (data: DailyProgressForm) => {
    console.log("Form submission data:", data)
    console.log("Selected project:", selectedProject)
    console.log("Initial project ID:", initialProjectId)
    console.log("Form values:", form.getValues())
    console.log("Form errors:", form.formState.errors)

    // Ensure we have a valid project ID
    const projectId = data.projectId || selectedProject?.id || initialProjectId

    if (!projectId) {
      toast.error("No active challenge found to post to. Please try again.")
      console.error("Missing project ID:", { data, selectedProject, initialProjectId })
      return
    }

    console.log("Using project ID:", projectId)

    // Double-check that the form data is valid
    if (!data.content || data.content.trim().length < 10) {
      toast.error("Please enter at least 10 characters for your progress update.")
      return
    }

    // Ensure the form data is complete
    const formData = {
      projectId: projectId,
      content: data.content.trim(),
    }

    console.log("Final form data being submitted:", formData)

    // Final validation before proceeding
    if (!formData.projectId || !formData.content) {
      toast.error("Form data is incomplete. Please try again.")
      console.error("Incomplete form data:", formData)
      return
    }
    let imageData = undefined;

    if (editMode && existingImageUrl) {
      // Edit mode: use existing image data
      imageData = {
        url: existingImageUrl,
        filename: existingImageData?.filename ?? 'existing-image',
        size: existingImageData?.size ?? 0,
        mimeType: existingImageData?.mimeType ?? 'image/jpeg',
        width: existingImageData?.width,
        height: existingImageData?.height,
      };
    } else if (uploadedImage?.file) {
      // Create mode: upload new image to S3
      try {
        const uploadResult = await uploadImageToS3(
          uploadedImage.file,
          projectId,
          "user-id" // Replace with actual user ID from context
        );

        if (uploadResult.success) {
          imageData = {
            url: uploadResult.url,
            filename: uploadedImage.filename,
            size: uploadedImage.size,
            mimeType: uploadedImage.mimeType,
            width: uploadedImage.width,
            height: uploadedImage.height,
          };
        } else {
          toast.error("Failed to upload image: " + uploadResult.error);
          return;
        }
      } catch {
        toast.error("Failed to upload image");
        return;
      }
    }

    if (editMode) {
      updateDailyPost.mutate({
        id: postId ?? "", // This should be the post ID, not project ID
        content: data.content,
        imageData,
      });
    } else {
      console.log("Calling createDailyPost with:", {
        projectId: projectId,
        content: data.content,
        imageData,
      })

      createDailyPost.mutate({
        projectId: formData.projectId,
        content: formData.content,
        imageData,
      }, {
        onSuccess: () => {
          // Refresh queries to update project state
          void utils.project.getUserProjects.invalidate()
          void utils.progress.canPostToday.invalidate()
        }
      });
    }
  };



  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files?.length > 0) {
      const file = files?.[0]
      if (file) {
        void handleFileSelect(file)
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target?.files
    const hasFile = Boolean(filesList && filesList.length > 0)
    if (hasFile) {
      const file = filesList?.[0]
      if (file) {
        void handleFileSelect(file)
      }
    }
  }

  // Handle loading state
  if (!projectsData) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">Loading projects...</span>
      </div>
    )
  }

  // Check if we have a valid project
  if (!selectedProject) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Project not found.</p>
        <p className="text-sm">Please check the project ID: {initialProjectId}</p>
      </div>
    )
  }

  // Ensure projectId is set in form before allowing submission
  const currentProjectId = form.getValues("projectId")
  if (!currentProjectId && selectedProject?.id) {
    console.log("Setting projectId in form before render:", selectedProject.id)
    form.setValue("projectId", selectedProject.id)
  }

  console.log("Current form projectId:", currentProjectId)
  console.log("Selected project ID:", selectedProject?.id)

  // Prevent rendering if projectId is not set
  if (!currentProjectId && !selectedProject?.id) {
    console.error("No project ID available for form")
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Project not available.</p>
        <p className="text-sm">Please try again or refresh the page.</p>
      </div>
    )
  }

  const hasPostedToday = todayStatus?.hasPostedToday ?? false
  const canPost = canPostToday?.canPost ?? false

  const dialogContent = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {editMode ? 'Edit Progress Update' : 'Daily Progress Update'}
        </DialogTitle>
        <DialogDescription>
          {editMode
            ? 'Update your progress post with new content or image'
            : 'Share what you\'ve accomplished today on your build-in-public journey'
          }
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Today's Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          {hasPostedToday ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Great job today!</div>
                <div className="text-sm text-green-600">
                  You&apos;ve already posted your progress for today.
                </div>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <div className="font-medium text-amber-800">Time to share your progress!</div>
                <div className="text-sm text-amber-600">
                  {canPost
                    ? "Keep your streak going by posting today&apos;s update."
                    : "You can post your progress now."
                  }
                </div>
              </div>
            </>
          )}
        </div>

        {/* Progress Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Hidden project ID field to ensure it's always included */}
          <input
            type="hidden"
            {...form.register("projectId", {
              required: "Project ID is required",
              value: selectedProject?.id || initialProjectId || ""
            })}
          />

          {/* Project Info Display */}
          <div className="p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{selectedProject.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedProject.description ?? "No description"}
                </p>
              </div>
              <Badge variant="secondary">
                {selectedProject.streakStats?.[0]?.currentStreak ?? 0}/{selectedProject.targetStreakDays} days
              </Badge>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Image (Optional)</label>

            {editMode && existingImageUrl ? (
              // Edit mode: show existing image
              <div className="relative">
                <div className="relative rounded-lg overflow-hidden border">
                  <Image
                    src={existingImageUrl}
                    alt="Existing image"
                    className="w-full h-48 object-cover"
                    fill
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      Existing Image
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Filename: {existingImageData?.filename ?? 'existing-image'}</p>
                  <p>Size: {existingImageData?.size ? `${(existingImageData.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
                  {existingImageData?.width && existingImageData?.height && (
                    <p>Dimensions: {existingImageData.width} × {existingImageData.height}</p>
                  )}
                </div>
              </div>
            ) : !uploadedImage ? (
              // Create mode: show upload area
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {isUploading ? (
                  <div className="space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-600">Uploading image...</p>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Drop an image here, or click to select
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, WebP, GIF up to 10MB
                      </p>
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        💡 Tip: You can also paste images from clipboard (Ctrl+V)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Show uploaded new image
              <div className="relative">
                <div className="relative rounded-lg overflow-hidden border h-48">
                  <Image
                    src={uploadedImage.url}
                    alt="Uploaded image"
                    className="w-full object-cover"
                    fill
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Filename: {uploadedImage.filename}</p>
                  <p>Size: {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                  {uploadedImage.width && uploadedImage.height && (
                    <p>Dimensions: {uploadedImage.width} × {uploadedImage.height}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progress Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Today&apos;s Progress</label>
            <Textarea
              placeholder={`What did you accomplish today on ${selectedProject.name}? Share your wins, challenges, and learnings...`}
              className="resize-none min-h-[120px]"
              onPaste={handleClipboardPaste}
              {...form.register("content")}
            />

            {/* Clipboard paste info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clipboard className="h-3 w-3" />
              <span>You can paste text from clipboard (Ctrl+V)</span>
            </div>

            {/* SQL injection error display */}
            {clipboardError && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 border border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{clipboardError}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Share your build-in-public journey</span>
              <span>{form.watch("content").length}/1000</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span>
                Current streak: <strong>{selectedProject.streakStats?.[0]?.currentStreak ?? 0}</strong> days
              </span>
            </div>

            <Button
              type="submit"
              disabled={createDailyPost.isPending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {createDailyPost.isPending
                ? (editMode ? "Updating..." : "Posting...")
                : (editMode ? "Update Progress" : (hasPostedToday ? "Post Another Update" : "Post Progress"))
              }
            </Button>
          </div>
        </form>

        {/* Quick Tips */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">💡 Quick Tips for Great Updates:</div>
            <ul className="space-y-1 text-blue-700">
              <li>• Share specific features you built or bugs you fixed</li>
              <li>• Include screenshots or code snippets when possible</li>
              <li>• Mention challenges you overcame and lessons learned</li>
              <li>• Ask for feedback or help from the community</li>
              <li>• Use Ctrl+V to paste images or text from clipboard</li>
            </ul>
          </div>
        </div>
      </div>
    </DialogContent>
  )

  // If trigger is provided, use it as the dialog trigger
  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange ?? setIsDialogOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    )
  }

  // Otherwise, use a default button trigger
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start">
          <ImageIcon className="h-4 w-4 mr-2" />
          Add Progress
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
}
