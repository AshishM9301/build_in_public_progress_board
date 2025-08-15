"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/trpc/react"
import { Project } from "@/types/project"
import { toast } from "sonner"

const editProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
  description: z.string().max(500, "Description too long").optional(),
  categoryId: z.string().min(1, "Category is required"),
})

type EditProjectForm = z.infer<typeof editProjectSchema>

interface EditProjectDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const utils = api.useUtils()
  
  const { data: existingCategories } = api.category.getCategoriesForSelect.useQuery()
  
  const updateProject = api.project.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully!")
      utils.project.getUserProjects.invalidate()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update project")
    },
  })

  const form = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
      categoryId: project.categoryId,
    },
  })

  const onSubmit = (data: EditProjectForm) => {
    updateProject.mutate({
      id: project.id,
      ...data,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project details and category
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {existingCategories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateProject.isLoading}
              >
                {updateProject.isLoading ? "Updating..." : "Update Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
