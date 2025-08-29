"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { api } from "@/trpc/react"
import { STREAK_GOAL_OPTIONS } from "@/types/project"
import { toast } from "sonner"
import { CategoryCombobox } from "@/components/category-combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"

// Define the category object structure
interface SelectedCategory {
    id?: string
    name: string
    isNew: boolean
    projectCount?: number
}

const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
    description: z.string().max(500, "Description too long").optional(),
    // startDate: z.date().optional(), // Commented out - will use start button on project page instead
    targetStreakDays: z.number().min(1, "Must be at least 1 day"),
    customStreakDays: z.number().min(1, "Must be at least 1 day").optional(),
})

type CreateProjectForm = z.infer<typeof createProjectSchema>

interface CreateProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onProjectCreated?: () => void
}

export function CreateProjectDialog({ open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) {
    // Unified state for selected categories (both existing and new)
    const [selectedCategories, setSelectedCategories] = useState<SelectedCategory[]>([])

    const utils = api.useUtils()

    const { data: categories, refetch: refetchUserCategories } = api.category.getUserCategories.useQuery()
    const { data: categoriesForSelect, refetch: refetchCategoriesForSelect } = api.category.getCategoriesForSelect.useQuery()

    // Extract categories array from the API response, default to empty array
    const existingCategories = categoriesForSelect?.categories ?? []

    // State for search
    const [searchTerm, setSearchTerm] = useState("")

    // Backend search query
    const { data: searchResults, refetch: refetchSearchResults } = api.category.searchCategories.useQuery(
        { searchTerm: searchTerm.trim() || undefined },
        { enabled: searchTerm.trim().length > 0 }
    )

    // Refetch categories when dialog opens to ensure fresh data
    useEffect(() => {
        if (open) {
            refetchUserCategories()
            refetchCategoriesForSelect()
            if (searchTerm.trim().length > 0) {
                refetchSearchResults()
            }
        }
    }, [open, refetchUserCategories, refetchCategoriesForSelect, refetchSearchResults, searchTerm])

    const createProject = api.project.create.useMutation({
        onSuccess: () => {
            toast.success("Project created successfully!")
            utils.project.getUserProjects.invalidate()
            utils.streak.getStreakStats.invalidate()
            onOpenChange(false)
            form.reset()
            // Reset selected categories
            setSelectedCategories([])
            // Call the callback if provided
            onProjectCreated?.()
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
            // startDate: new Date(), // Commented out - will use start button on project page instead
            targetStreakDays: 7,
        },
    })

    const watchedStreakDays = form.watch("targetStreakDays")
    // const watchedStartDate = form.watch("startDate") // Commented out - will use start button on project page instead

    const onSubmit = async (data: CreateProjectForm) => {
        const finalStreakDays = data.targetStreakDays === 0
            ? data.customStreakDays!
            : data.targetStreakDays

        try {
            if (selectedCategories.length > 0) {
                // Separate existing and new categories
                const existingCategories = selectedCategories.filter(cat => !cat.isNew)
                const newCategories = selectedCategories.filter(cat => cat.isNew)

                const finalCategoryIds: string[] = []

                if (newCategories.length > 0) {
                    // Create all new categories first
                    const categoryPromises = newCategories.map(category =>
                        createCategory.mutateAsync({ name: category.name })
                    )

                    const categoryResults = await Promise.all(categoryPromises)

                    // Check if all categories were created successfully
                    const successfulCategories = categoryResults.filter(result => result.success)

                    if (successfulCategories.length > 0) {
                        // Add all successfully created category IDs
                        finalCategoryIds.push(...successfulCategories.map(result => result.category.id))
                    } else {
                        toast.error("Failed to create any new categories")
                        return
                    }
                }

                // Add existing category IDs
                if (existingCategories.length > 0) {
                    finalCategoryIds.push(...existingCategories.map(cat => cat.id!))
                }

                // Create project with all selected categories
                createProject.mutate({
                    ...data,
                    targetStreakDays: finalStreakDays,
                    categoryIds: finalCategoryIds,
                    // startDate: data.startDate, // Commented out - will use start button on project page instead
                })
            } else {
                toast.error("Please select at least one category")
            }
        } catch (error) {
            toast.error("Failed to create project")
        }
    }

    const handleCategorySelect = (categoryId: string, isNewCategory: boolean, newCategoryName?: string) => {
        if (isNewCategory && newCategoryName) {
            // Add new category to the array if it's not already there
            const categoryExists = selectedCategories.some(cat =>
                cat.name.toLowerCase() === newCategoryName.toLowerCase()
            )

            if (!categoryExists) {
                const newCategory: SelectedCategory = {
                    name: newCategoryName,
                    isNew: true
                }
                setSelectedCategories(prev => [...prev, newCategory])
            }
        } else {
            // Add existing category if it's not already there
            const categoryExists = selectedCategories.some(cat => cat.id === categoryId)

            if (!categoryExists) {
                const existingCategory = existingCategories.find(cat => cat.id === categoryId)
                if (existingCategory) {
                    const selectedCategory: SelectedCategory = {
                        id: existingCategory.id,
                        name: existingCategory.name,
                        isNew: false,
                        projectCount: existingCategory.projectCount
                    }
                    setSelectedCategories(prev => [...prev, selectedCategory])
                }
            }
        }
    }

    // Reset selected categories when dialog closes
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedCategories([])
            form.reset()
        }
        onOpenChange(open)
    }

    // Function to remove a selected category
    const removeCategory = (categoryName: string) => {
        setSelectedCategories(prev => prev.filter(cat => cat.name !== categoryName))
    }

    // Check if form is valid (has name and at least one category)
    const isFormValid = form.formState.isValid && selectedCategories.length > 0

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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

                        <FormItem>
                            <FormLabel>Categories</FormLabel>
                            <FormControl>
                                <CategoryCombobox
                                    categories={searchTerm.trim() ? (searchResults?.categories ?? []) : (existingCategories ?? [])}
                                    hasExactMatch={searchTerm.trim() ? searchResults?.hasExactMatch ?? false : false}
                                    searchTerm={searchTerm}
                                    onSearchChange={setSearchTerm}
                                    value=""
                                    onValueChange={(value, isNewCategory, newCategoryName) =>
                                        handleCategorySelect(value, isNewCategory ?? false, newCategoryName)
                                    }
                                    placeholder="Select or create categories"
                                />
                            </FormControl>
                        </FormItem>

                        {/* Display all selected categories */}
                        {selectedCategories.length > 0 && (
                            <div className="space-y-3">
                                <div className="text-sm text-muted-foreground">
                                    Selected categories:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCategories.map((category, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className={`group relative pr-8 ${category.isNew
                                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300"
                                                : "bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
                                                }`}
                                        >
                                            {category.isNew ? (
                                                <Plus className="h-3 w-3 mr-1.5 text-blue-600" />
                                            ) : (
                                                <span className="mr-1.5 text-green-600">✓</span>
                                            )}
                                            {category.name}
                                            {!category.isNew && category.projectCount && (
                                                <span className="ml-1 text-xs opacity-75">
                                                    ({category.projectCount})
                                                </span>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeCategory(category.name)}
                                                className="absolute right-1 h-4 w-4 p-0 hover:bg-black/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Project Timeline - Commented out - will use start button on project page instead */}
                        {/* <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value}
                                                onDateChange={field.onChange}
                                                placeholder="Choose when to start your project"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            When do you want to start your streak challenge?
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                    <Input
                                        value={(() => {
                                            if (!watchedStartDate || !watchedStreakDays) return "Select start date and streak days"

                                            const endDate = new Date(watchedStartDate)
                                            endDate.setDate(watchedStartDate.getDate() + watchedStreakDays - 1)
                                            return format(endDate, "PPP")
                                        })()}
                                        disabled
                                        className="bg-muted"
                                    />
                                </FormControl>
                                <FormDescription>
                                    Automatically calculated based on start date and streak duration
                                </FormDescription>
                            </FormItem>
                        </div> */}

                        <FormField
                            control={form.control}
                            name="targetStreakDays"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Streak Challenge Goal</FormLabel>
                                    <FormControl>
                                        <div className="grid grid-cols-2 gap-2">
                                            {STREAK_GOAL_OPTIONS.map((option) => (
                                                <Button
                                                    key={option.value}
                                                    type="button"
                                                    variant={field.value === option.value ? "default" : "outline"}
                                                    className="justify-start"
                                                    onClick={() => field.onChange(option.value)}
                                                >
                                                    {option.label}
                                                </Button>
                                            ))}
                                        </div>
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
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createProject.isPending || !isFormValid}
                            >
                                {createProject.isPending ? "Creating..." : "Create Project"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
