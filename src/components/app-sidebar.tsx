"use client"

import { useEffect, useMemo, useState } from "react"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import { Sidebar, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { Folder } from "lucide-react"
import { api } from "@/trpc/react"
import { EnhancedDailyProgressForm } from "@/app/_components/enhanced-daily-progress-form"
import { Button } from "@/components/ui/button"
import { CreateProjectDialog } from "@/app/_components/create-project-dialog"
import { MissedPostErrorDialog } from "@/app/_components/missed-post-error-dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Sidebar collapse state not used currently; remove to satisfy linter

  const { data: projectsData } = api.project.getUserProjects.useQuery()
  const projects = useMemo(() => projectsData?.projects ?? [], [projectsData?.projects])

  // Debug logging to identify potential duplicates
  useEffect(() => {
    if (projects.length > 0) {
      console.log("AppSidebar - Projects data:", projects.map(p => ({ id: p.id, name: p.name })))

      // Check for duplicate IDs
      const ids = projects.map(p => p.id)
      const uniqueIds = new Set(ids)
      if (ids.length !== uniqueIds.size) {
        console.error("AppSidebar - Duplicate project IDs found:", ids.filter((id, index) => ids.indexOf(id) !== index))
      }

      // Check for duplicate names
      const names = projects.map(p => p.name)
      const uniqueNames = new Set(names)
      if (names.length !== uniqueNames.size) {
        console.warn("AppSidebar - Duplicate project names found:", names.filter((name, index) => names.indexOf(name) !== index))
      }
    }
  }, [projects])

  // Assume single active challenge semantics: pick the first active project as current
  const activeProject = useMemo(() => projects[0], [projects])

  const { data: canPostToday, isLoading: canPostTodayLoading } = api.progress.canPostToday.useQuery(
    { projectId: activeProject?.id ?? "" },
    { enabled: Boolean(activeProject?.id) }
  )

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [buttonState, setButtonState] = useState<"create" | "post" | "missed">("create")
  const [isValidating, setIsValidating] = useState(false)
  const [errorData, setErrorData] = useState<{ missedDate: Date; reason: string } | null>(null)


  const utils = api.useUtils()
  const validatePostingDate = api.progress.validatePostingDate.useMutation()


  // Reset error state when projects change (new project created)
  useEffect(() => {
    if (projects.length > 0 && errorData) {
      setErrorData(null)
      setIsErrorDialogOpen(false)
    }
  }, [projects, errorData])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine button state based on project existence and startedAt status
  useEffect(() => {
    if (!mounted) return

    console.log("Button state calculation:", {
      activeProject: activeProject?.name,
      canPostToday,
      currentButtonState: buttonState
    })

    if (!activeProject) {
      setButtonState("create")
    } else if (!activeProject.startedAt) {
      // Project exists but hasn't started (no first post yet)
      setButtonState("create")
    } else if (canPostToday?.canPost) {
      // Project is active and can post today
      setButtonState("post")
    } else if (canPostToday === undefined || canPostTodayLoading) {
      // Still loading, don't change state yet
      return
    } else {
      // Project is active but can't post today
      setButtonState("missed")
    }
  }, [mounted, activeProject, canPostToday, canPostTodayLoading])

  // Get button text based on state
  const getButtonText = () => {
    if (!mounted) return "Loading..."

    switch (buttonState) {
      case "create":
        // If we have a project but it's not started, show different text
        if (activeProject && !activeProject.startedAt) {
          return "Start Project"
        }
        return "Create Project"
      case "post":
        return "Add Post"
      case "missed":
        return "Missed Post"
      default:
        return "Create Project"
    }
  }

  // Get button variant based on state
  const getButtonVariant = () => {
    switch (buttonState) {
      case "create":
        return "default"
      case "post":
        return "default"
      case "missed":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Handle button click based on current state
  const handleButtonClick = async () => {
    if (!mounted) return

    switch (buttonState) {
      case "create":
        // If we have a project but it's not started, show create project dialog
        // The first post will automatically start the project
        setIsCreateDialogOpen(true)
        break

      case "post":
        if (!activeProject?.id) return

        setIsValidating(true)
        try {
          const result = await validatePostingDate.mutateAsync({ projectId: activeProject.id })

          if (result.success && result.isValidDate) {
            // Valid date, allow posting (EnhancedDailyProgressForm will handle this)
            return
          } else if (result.missedDate && result.reason) {
            // Invalid date - show error dialog
            setErrorData({
              missedDate: result.missedDate,
              reason: result.reason
            })
            setIsErrorDialogOpen(true)
            setButtonState("missed")
          }
        } catch (error) {
          toast.error("Failed to validate posting date")
        } finally {
          setIsValidating(false)
        }
        break

      case "missed":
        // Show create project dialog for missed post scenarios
        setIsCreateDialogOpen(true)
        break
    }
  }

  // Handle creating new project after missed post
  const handleCreateNewProject = () => {
    setIsErrorDialogOpen(false)
    setIsCreateDialogOpen(true)
  }

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Folder,
      isActive: true,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Folder,
      isActive: true,
      items: [
        ...projects.map((project) => ({
          title: project.name,
          url: `/projects/${project.id}`,
          key: project.id,
        })),
      ],
    },
  ]

  const items = [
    {
      title: "Introduction",
      url: "#",
      icon: Folder,
    },
    {
      title: "Installation",
      url: "#",
      icon: Folder,
    },
  ]

  const user = {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarGroup className="border h-full rounded-lg bg-white">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <h1 className="text-2xl font-bold">Build in Public</h1>
            </SidebarMenuItem>
            {/* Dynamic button that changes based on project state */}
            <SidebarMenuItem>
              {!mounted ? (
                <Button size="sm" variant="outline" className="w-full" disabled>
                  Loading...
                </Button>
              ) : buttonState === "post" && activeProject ? (
                <EnhancedDailyProgressForm
                  projectId={activeProject.id}
                  trigger={
                    <Button
                      size="sm"
                      variant={getButtonVariant()}
                      className="w-full"
                      onClick={handleButtonClick}
                      disabled={isValidating}
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        getButtonText()
                      )}
                    </Button>
                  }
                />
              ) : (
                <Button
                  size="sm"
                  variant={getButtonVariant()}
                  className="w-full"
                  onClick={handleButtonClick}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-2 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    getButtonText()
                  )}
                </Button>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <div className="flex flex-1 flex-col gap-2 ">
          <NavMain items={navMain} />
          <NavProjects />
          <NavSecondary items={items} />
        </div>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>

      </SidebarGroup>

      {/* Create Project Dialog */}
      {isCreateDialogOpen && (
        <CreateProjectDialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            // If dialog is closing, refresh queries to get updated state
            if (!open) {
              void utils.progress.canPostToday.invalidate()
            }
          }}
          onProjectCreated={() => {
            // Refresh queries when a new project is created
            void utils.progress.canPostToday.invalidate()
            void utils.project.getUserProjects.invalidate()
            // Reset button state to allow recalculation
            setButtonState("create")
          }}
        />
      )}

      {/* Missed Post Error Dialog */}
      {errorData && (
        <MissedPostErrorDialog
          open={isErrorDialogOpen}
          onOpenChange={setIsErrorDialogOpen}
          missedDate={errorData.missedDate}
          reason={errorData.reason}
          onCreateNewProject={handleCreateNewProject}
        />
      )}
    </Sidebar>
  )
}

// Render create project dialog outside where needed
export function AppSidebarWithCreateDialog(props: React.ComponentProps<typeof Sidebar>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <AppSidebar {...props} />
      {open && <CreateProjectDialog open={open} onOpenChange={setOpen} />}
    </>
  )
}

// Deprecated wrapper (unused), kept for potential future composition
