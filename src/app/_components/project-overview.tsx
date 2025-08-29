"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Target, TrendingUp, Trophy, Edit, Trash2 } from "lucide-react"
import { Project } from "@/types/project"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { EditProjectDialog } from "./edit-project-dialog"

interface ProjectOverviewProps {
  projects: Project[]
}

export function ProjectOverview({ projects }: ProjectOverviewProps) {
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const utils = api.useUtils()

  const deleteProject = api.project.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully!")
      utils.project.getUserProjects.invalidate()
      utils.streak.getStreakStats.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project")
    },
  })

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProject.mutate({ id: projectId })
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStreakStatus = (project: Project) => {
    const stats = project.streakStats
    if (!stats) return { current: 0, target: project.targetStreakDays, percentage: 0 }

    const percentage = (stats.currentStreak / project.targetStreakDays) * 100
    return {
      current: stats.currentStreak,
      target: project.targetStreakDays,
      percentage: Math.min(percentage, 100)
    }
  }

  if (projects.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Your Projects</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project, index) => {
          const streakStatus = getStreakStatus(project)
          const isCompleted = streakStatus.current >= streakStatus.target
          const isActive = project.isActive

          // Create a more robust key that handles potential duplicate IDs
          const uniqueKey = `${project.id}-${project.name}-${index}`

          return (
            <Card key={uniqueKey} className={`relative ${isCompleted ? 'border-green-200 bg-green-50/50' : ''}`}>
              {isCompleted && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Trophy className="h-3 w-3 mr-1" />
                    Completed!
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProject(project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{project.category?.name}</Badge>
                  <span>•</span>
                  <span>Started {formatDate(project.startDate)}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Streak Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Streak Progress
                    </span>
                    <span className="font-medium">
                      {streakStatus.current} / {streakStatus.target} days
                    </span>
                  </div>
                  <Progress value={streakStatus.percentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Day {streakStatus.current}</span>
                    <span>{Math.round(streakStatus.percentage)}% complete</span>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Target</div>
                      <div className="text-muted-foreground">{project.targetStreakDays} days</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Started</div>
                      <div className="text-muted-foreground">{formatDate(project.startDate)}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isCompleted ? (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // TODO: Implement extend streak functionality
                        toast.info("Extend streak functionality coming soon!")
                      }}
                    >
                      Extend Challenge
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        // TODO: Navigate to daily progress form
                        toast.info("Daily progress form coming soon!")
                      }}
                    >
                      Post Today's Progress
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Project Dialog */}
      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
        />
      )}
    </div>
  )
}
