"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Edit, Image as ImageIcon, User, AlertCircle } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { EnhancedDailyProgressForm } from "./enhanced-daily-progress-form"
import Image from "next/image"

interface ProgressPostDialogProps {
  projectId: string
  dayNumber: number
  targetDate: Date
  isCompleted: boolean
  trigger: React.ReactNode
}

export function ProgressPostDialog({
  projectId,
  dayNumber,
  targetDate,
  isCompleted,
  trigger
}: ProgressPostDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const utils = api.useUtils()

  // Get the progress post for this specific day
  const { data: progressData, isLoading } = api.progress.getProgressByDate.useQuery(
    { projectId, targetDate },
    { enabled: isOpen && isCompleted }
  )

  const progress = progressData?.progress?.[0] // Get the first progress item
  const isToday = new Date().toDateString() === targetDate.toDateString()

  const handleClose = () => {
    setIsOpen(false)
    setIsEditMode(false)
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleEditSuccess = () => {
    setIsEditMode(false)
    setIsOpen(false)
    // Refresh the project data
    void utils.project.getProject.invalidate({ id: projectId })
    toast.success("Progress updated successfully!")
  }

  const handleEditCancel = () => {
    setIsEditMode(false)
  }

  if (isEditMode) {
    return (
      <EnhancedDailyProgressForm
        projectId={projectId}
        editMode={true}
        postId={progress?.id}
        existingImageUrl={progress?.imageUrl ?? undefined}
        existingImageData={progress?.imageUrl ? {
          filename: progress.imageFilename ?? 'existing-image',
          size: progress.imageSize ?? 0,
          mimeType: progress.imageMimeType ?? 'image/jpeg',
          width: progress.imageWidth ?? undefined,
          height: progress.imageHeight ?? undefined,
        } : undefined}
        onSuccess={handleEditSuccess}
        trigger={
          <Button variant="outline" className="w-full">
            Edit Progress
          </Button>
        }
        open={true}
        onOpenChange={handleEditCancel}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Day {dayNumber} Progress
          </DialogTitle>
          <DialogDescription>
            {isToday ? "Today's progress update" : `Progress from ${targetDate.toLocaleDateString()}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading progress...</span>
            </div>
          ) : !isCompleted ? (
            <div className="text-center p-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Progress Recorded</p>
              <p className="text-sm">No progress has been recorded for Day {dayNumber} yet.</p>
            </div>
          ) : !progress ? (
            <div className="text-center p-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Progress Not Found</p>
              <p className="text-sm">The progress post for this day could not be found.</p>
            </div>
          ) : (
            <>
              {/* Progress Content */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Posted on {progress.createdAt.toLocaleDateString()} at {progress.createdAt.toLocaleTimeString()}</span>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border">
                  <p className="whitespace-pre-wrap">{progress.content}</p>
                </div>

                {/* Image if exists */}
                {progress.imageUrl && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Progress Image
                    </label>
                    <div className="relative rounded-lg overflow-hidden border">
                      <Image
                        src={progress.imageUrl}
                        alt="Progress image"
                        className="w-full h-64 object-cover"
                        fill
                      />
                    </div>
                    {progress.imageFilename && (
                      <p className="text-xs text-muted-foreground">
                        {progress.imageFilename}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Day {dayNumber}
                  </Badge>
                  {isToday && (
                    <Badge variant="outline" className="text-xs text-blue-600">
                      Today
                    </Badge>
                  )}
                </div>

                {isToday && (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
