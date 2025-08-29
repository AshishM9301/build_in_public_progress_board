"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Trash2, Calendar, Target, Trophy, TrendingUp } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { EnhancedDailyProgressForm } from "@/app/_components/enhanced-daily-progress-form"
import { ProgressPostDialog } from "@/app/_components/progress-post-dialog"
import { DeleteProjectDialog } from "@/app/_components/delete-project-dialog"

export default function SingleProjectPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const { data: projectData, isLoading } = api.project.getProject.useQuery({ id: projectId })
    const project = projectData?.project

    const utils = api.useUtils()
    const startProject = api.project.startProject.useMutation({
        onSuccess: () => {
            toast.success("Project started successfully!")
            utils.project.getProject.invalidate({ id: projectId })
        },
        onError: (error) => {
            toast.error(error.message || "Failed to start project")
        },
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-lg">Loading project...</p>
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
                    <p className="text-muted-foreground mb-6">The project you&apos;re looking for doesn&apos;t exist.</p>
                    <Button onClick={() => router.push("/projects")}>
                        Back to Projects
                    </Button>
                </div>
            </div>
        )
    }

    const getStreakProgress = () => {
        const totalDays = project.targetStreakDays
        const completedDays = project.dailyProgress?.length ?? 0

        return {
            completed: completedDays,
            total: totalDays,
            percentage: totalDays > 0 ? (completedDays / totalDays) * 100 : 0
        }
    }

    const getStatusColor = () => {
        const progress = getStreakProgress()
        if (progress.completed === progress.total) return "bg-green-100 text-green-800"
        if (progress.completed > 0) return "bg-blue-100 text-blue-800"
        return "bg-gray-100 text-gray-800"
    }

    const getStatusText = () => {
        const progress = getStreakProgress()
        if (progress.completed === progress.total) return "Completed"
        if (progress.completed > 0) return "In Progress"
        return "Not Started"
    }

    const streakProgress = getStreakProgress()

    return (
        <div className="container mx-auto px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/projects")}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Projects
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                        {project.description && (
                            <p className="text-muted-foreground mt-1">{project.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/projects/${projectId}/edit`)}
                        className="flex items-center gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Project Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Project Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Start Date</p>
                                        <p className="text-sm text-muted-foreground">
                                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not started yet"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Target Days</p>
                                        <p className="text-sm text-muted-foreground">
                                            {project.targetStreakDays} days
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Streak Progress</span>
                                    <span>{streakProgress.completed}/{streakProgress.total} days</span>
                                </div>
                                <Progress value={streakProgress.percentage} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Categories */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Categories</CardTitle>
                            <CardDescription>
                                Project is tagged with these categories
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {project.categories.map((cat: { category: { id: string; name: string } }) => (
                                    <Badge
                                        key={cat.category.id}
                                        variant="secondary"
                                        className="text-sm px-3 py-1"
                                    >
                                        {cat.category.name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Progress Summary
                            </CardTitle>
                            <CardDescription>
                                Your progress on this {project.targetStreakDays}-day streak challenge
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Progress Posts</span>
                                    <span className="text-sm text-muted-foreground">
                                        {project.dailyProgress?.length ?? 0} of {project.targetStreakDays}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Completion Rate</span>
                                        <span>{Math.round(((project.dailyProgress?.length ?? 0) / project.targetStreakDays) * 100)}%</span>
                                    </div>
                                    <Progress value={((project.dailyProgress?.length ?? 0) / project.targetStreakDays) * 100} className="h-2" />
                                </div>
                                {project.dailyProgress && project.dailyProgress.length > 0 && project.dailyProgress[0] && (
                                    <div className="text-sm text-muted-foreground">
                                        Latest post: {new Date(project.dailyProgress[0].createdAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5" />
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {project.startedAt ? (
                                // Project started - show status
                                <Badge
                                    variant="secondary"
                                    className={`w-full justify-center text-sm py-2 ${getStatusColor()}`}
                                >
                                    {getStatusText()}
                                </Badge>
                            ) : (
                                // Project not started yet - show start button
                                <div className="space-y-3">
                                    <Badge
                                        variant="secondary"
                                        className="w-full justify-center text-sm py-2 bg-gray-100 text-gray-800"
                                    >
                                        Not Started
                                    </Badge>
                                    <Button
                                        onClick={() => startProject.mutate({ projectId })}
                                        className="w-full"
                                        disabled={startProject.isPending}
                                    >
                                        {startProject.isPending ? "Starting..." : "Start Project"}
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center">
                                        Click to begin your {project.targetStreakDays}-day streak challenge
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Current Streak</span>
                                <span className="font-medium">
                                    {project.streakStats?.[0]?.currentStreak ?? 0} days
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Longest Streak</span>
                                <span className="font-medium">
                                    {project.streakStats?.[0]?.longestStreak ?? 0} days
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Total Posts</span>
                                <span className="font-medium">
                                    {project.streakStats?.[0]?.totalPosts ?? 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <EnhancedDailyProgressForm
                                projectId={projectId}
                                trigger={
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                    >
                                        Add Progress
                                    </Button>
                                }
                                onSuccess={() => {
                                    // Refresh the project data to show updated progress
                                    void utils.project.getProject.invalidate({ id: projectId })
                                }}
                            />
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                    // TODO: Implement extend streak functionality
                                    console.log("Extend streak for project:", projectId)
                                }}
                            >
                                Extend Streak
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Project Dialog */}
            <DeleteProjectDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                projectId={projectId}
                projectName={project.name}
            />
        </div>
    )
}
