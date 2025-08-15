"use client"

import { useState } from "react"
import { Plus, Trophy, Target, Calendar, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/trpc/react"

export function ProgressBoard() {
  const { user } = useAuth()
  const [showCreateProject, setShowCreateProject] = useState(false)

  const { data: projects, isLoading: projectsLoading } = api.project.getUserProjects.useQuery()
  const { data: badgeStats } = api.badge.getOverviewBadgeStats.useQuery()

  // Debug logging
  console.log('ProgressBoard render:', { user, projects, badgeStats })

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view your progress board.</p>
      </div>
    )
  }

  // Show loading state
  if (projectsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading your progress board...</p>
        </div>
      </div>
    )
  }

  // Safely extract data with fallbacks
  const activeProjects = projects?.projects ?? []
  const totalProjects = projects?.count ?? 0
  const totalBadges = badgeStats?.totalBadges ?? 0
  const earnedBadges = badgeStats?.earnedBadges ?? 0

  // Calculate overview stats from projects with safe fallbacks
  const totalStreakDays = activeProjects.reduce((sum: number, project: any) => {
    return sum + (project.targetStreakDays ?? 0)
  }, 0)

  const completedStreakDays = activeProjects.reduce((sum: number, project: any) => {
    const projectStats = project.streakStats?.[0]
    return sum + (projectStats?.currentStreak ?? 0)
  }, 0)

  const hasActiveStreaks = activeProjects.some((project: any) => {
    const projectStats = project.streakStats?.[0]
    return projectStats && (projectStats.currentStreak ?? 0) > 0
  })

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Build in Public Progress Board</h1>
          <p className="text-muted-foreground">
            Track your daily progress and build momentum with streak challenges
          </p>
        </div>
        <Button onClick={() => setShowCreateProject(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects.length === 0 ? "No projects yet" : "Projects in progress"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedStreakDays}</div>
            <p className="text-xs text-muted-foreground">
              of {totalStreakDays} total days
            </p>
            {totalStreakDays > 0 && (
              <Progress
                value={(completedStreakDays / totalStreakDays) * 100}
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnedBadges}</div>
            <p className="text-xs text-muted-foreground">
              of {totalBadges} available
            </p>
            {totalBadges > 0 && (
              <Progress
                value={(earnedBadges / totalBadges) * 100}
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasActiveStreaks ? "Active" : "None"}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasActiveStreaks
                ? "Keep up the momentum!"
                : "Start a project to begin"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects and Progress */}
        <div className="lg:col-span-2 space-y-6">
          {activeProjects.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Projects Yet</CardTitle>
                <CardDescription>
                  Start your first build-in-public project to begin tracking your progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowCreateProject(true)}>
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Projects</CardTitle>
                  <CardDescription>
                    You have {activeProjects.length} active project(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activeProjects.map((project: any) => (
                      <div key={project.id} className="p-3 border rounded-lg">
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.description || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Target: {project.targetStreakDays} days
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setShowCreateProject(true)}>
                Create New Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Project Dialog - Simplified for now */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            <p className="text-muted-foreground mb-4">
              This feature is coming soon! For now, you can see your progress overview.
            </p>
            <Button onClick={() => setShowCreateProject(false)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
