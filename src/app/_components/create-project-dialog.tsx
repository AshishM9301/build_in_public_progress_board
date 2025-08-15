"use client"

import { useState } from "react"
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
    FormDescription,
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
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { api } from "@/trpc/react"
import { STREAK_GOAL_OPTIONS } from "@/types/project"
import { toast } from "sonner"

const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
    description: z.string().max(500, "Description too long").optional(),
    categoryId: z.string().min(1, "Category is required"),
    targetStreakDays: z.number().min(1, "Must be at least 1 day"),
    customStreakDays: z.number().min(1, "Must be at least 1 day").optional(),
})

type CreateProjectForm = z.infer<typeof createProjectSchema>

interface CreateProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
    const [newCategory, setNewCategory] = useState("")
    const [showNewCategory, setShowNewCategory] = useState(false)

    const utils = api.useUtils()

    const { data: categories } = api.category.getUserCategories.useQuery()
    const { data: existingCategories } = api.category.getCategoriesForSelect.useQuery()

    const createProject = api.project.create.useMutation({
        onSuccess: () => {
            toast.success("Project created successfully!")
            utils.project.getUserProjects.invalidate()
            utils.streak.getStreakStats.invalidate()
            onOpenChange(false)
            form.reset()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create project")
        },
    })

    const createCategory = api.category.create.useMutation({
        onSuccess: () => {
            toast.success("Category created successfully!")
            utils.category.getUserCategories.invalidate()
            utils.category.getCategoriesForSelect.invalidate()
            setNewCategory("")
            setShowNewCategory(false)
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create category")
        },
    })

    const form = useForm<CreateProjectForm>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: "",
            description: "",
            categoryId: "",
            targetStreakDays: 7,
        },
    })

    const watchedStreakDays = form.watch("targetStreakDays")

    const onSubmit = (data: CreateProjectForm) => {
        const finalStreakDays = data.targetStreakDays === 0
            ? data.customStreakDays!
            : data.targetStreakDays

        createProject.mutate({
            ...data,
            targetStreakDays: finalStreakDays,
        })
    }

    const handleCreateCategory = () => {
        if (newCategory.trim()) {
            createCategory.mutate({ name: newCategory.trim() })
        }
    }

    const handleCategorySelect = (categoryId: string) => {
        if (categoryId === "new") {
            setShowNewCategory(true)
            form.setValue("categoryId", "")
        } else {
            form.setValue("categoryId", categoryId)
            setShowNewCategory(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Start a new build-in-public project and set your streak challenge goal.
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
                                        <Input placeholder="e.g., AI Podcast Summarizer" {...field} />
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
                                            placeholder="Describe what you're building..."
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
                                        <Select onValueChange={handleCategorySelect} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select or create a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {existingCategories?.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="new">
                                                    <div className="flex items-center gap-2">
                                                        <Plus className="h-4 w-4" />
                                                        Create New Category
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {showNewCategory && (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter category name"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowNewCategory(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleCreateCategory}
                                    disabled={!newCategory.trim()}
                                >
                                    Create
                                </Button>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="targetStreakDays"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Streak Challenge Goal</FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value.toString()}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STREAK_GOAL_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value.toString()}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormDescription>
                                        Choose how many consecutive days you want to post about your project.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {watchedStreakDays === 0 && (
                            <FormField
                                control={form.control}
                                name="customStreakDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Custom Streak Days</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                placeholder="Enter number of days"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

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
                                disabled={createProject.isLoading}
                            >
                                {createProject.isLoading ? "Creating..." : "Create Project"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
