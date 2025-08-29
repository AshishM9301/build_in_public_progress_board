"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"

interface DeleteProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  redirectAfterDelete?: boolean
}

export function DeleteProjectDialog({
  isOpen,
  onClose,
  projectId,
  projectName,
  redirectAfterDelete = true,
}: DeleteProjectDialogProps) {
  const router = useRouter()
  const utils = api.useUtils()

  const deleteProject = api.project.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully!")
      // Invalidate project queries to refresh the UI
      void utils.project.getUserProjects.invalidate()
      void utils.project.getProject.invalidate({ id: projectId })
      // Close dialog
      onClose()
      // Redirect only if specified
      if (redirectAfterDelete) {
        router.push("/projects")
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project")
    },
  })

  const handleDelete = () => {
    deleteProject.mutate({ id: projectId })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Project
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>&quot;{projectName}&quot;</strong>?
            This action cannot be undone and will remove all associated progress data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProject.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProject.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteProject.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
