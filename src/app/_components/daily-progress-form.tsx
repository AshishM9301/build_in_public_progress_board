"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Send, CheckCircle, AlertCircle } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { Project } from "@/types/project"

const dailyProgressSchema = z.object({
  projectId: z.string().min(1, "Please select a project"),
  content: z.string().min(10, "Progress update must be at least 10 characters").max(1000, "Progress update too long"),
})

type DailyProgressForm = z.infer<typeof dailyProgressSchema>

export function DailyProgressForm() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const utils = api.useUtils()

  const { data: projects } = api.project.getUserProjects.useQuery()
  const { data: todayStatus } = api.progress.getTodayStatus.useQuery(
    { projectId: selectedProject?.id || "" },
    { enabled: !!selectedProject?.id }
  )
  const { data: canPostToday } = api.progress.canPostToday.useQuery(
    { projectId: selectedProject?.id || "" },
    { enabled: !!selectedProject?.id }
  )

  const createDailyPost = api.progress.createDailyPost.useMutation({
    onSuccess: () => {
      toast.success("Daily progress posted successfully!")
      utils.progress.getTodayStatus.invalidate()
      utils.progress.getProgressHistory.invalidate()
      utils.streak.getStreakStats.invalidate()
      utils.project.getUserProjects.invalidate()
      form.reset()
      setSelectedProject(null)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to post progress")
    },
  })

  const form = useForm<DailyProgressForm>({
    resolver: zodResolver(dailyProgressSchema),
    defaultValues: {
      projectId: "",
      content: "",
    },
  })

  const onSubmit = (data: DailyProgressForm) => {
    createDailyPost.mutate({
      projectId: data.projectId,
      content: data.content,
    })
  }

  const handleProjectSelect = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId)
    setSelectedProject(project || null)
    form.setValue("projectId", projectId)
  }

  const activeProjects = projects?.filter(p => p.isActive) || []
  const hasPostedToday = todayStatus?.hasPostedToday || false
  const canPost = canPostToday?.canPost || false

  if (activeProjects.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Daily Progress Update
        </CardTitle>
        <CardDescription>
          Share what you've accomplished today on your build-in-public journey
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Today's Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          {hasPostedToday ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Great job today!</div>
                <div className="text-sm text-green-600">
                  You've already posted your progress for today.
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
                    ? "Keep your streak going by posting today's update."
                    : "You can post your progress now."
                  }
                </div>
              </div>
            </>
          )}
        </div>

        {/* Progress Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project</label>
            <Select onValueChange={handleProjectSelect} value={form.watch("projectId")}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project to update" />
              </SelectTrigger>
              <SelectContent>
                {activeProjects.map((project) => {
                  const stats = project.streakStats
                  const currentStreak = stats?.currentStreak || 0
                  const targetDays = project.targetStreakDays
                  const isCompleted = currentStreak >= targetDays

                  return (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{project.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={isCompleted ? "default" : "secondary"}>
                            {currentStreak}/{targetDays}
                          </Badge>
                          {isCompleted && (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedProject && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Today's Progress</label>
              <Textarea
                placeholder={`What did you accomplish today on ${selectedProject.name}? Share your wins, challenges, and learnings...`}
                className="resize-none min-h-[120px]"
                {...form.register("content")}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Share your build-in-public journey</span>
                <span>{form.watch("content").length}/1000</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedProject && (
                <span>
                  Current streak: <strong>{selectedProject.streakStats?.currentStreak || 0}</strong> days
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={!selectedProject || createDailyPost.isLoading || hasPostedToday}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {createDailyPost.isLoading ? "Posting..." : "Post Progress"}
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
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
