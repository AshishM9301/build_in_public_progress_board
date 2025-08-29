"use client"

import * as React from "react"
import {
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { api } from "@/trpc/react"
import { Badge } from "@/components/ui/badge"

export function NavProjects() {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const { data: projectsData } = api.project.getUserProjects.useQuery()
  const projects = projectsData?.projects ?? []
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const activeProjectId = mounted ? projects[0]?.id : undefined

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleEditProject = (projectId: string) => {
    router.push(`/projects/${projectId}/edit`)
  }

  const handleDeleteProject = async (projectId: string) => {
    // TODO: Implement delete functionality
    console.log("Delete project:", projectId)
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="text-muted-foreground">
              <Folder className="h-4 w-4" />
              <span>No projects yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          projects.map((project, index) => {
            // Create a more robust key that handles potential duplicate IDs
            const uniqueKey = `${project.id}-${project.name}-${index}`

            return (
              <SidebarMenuItem key={uniqueKey}>
                <SidebarMenuButton asChild>
                  <a href={`/projects/${project.id}`} className={project.id === activeProjectId ? "text-foreground" : "text-muted-foreground"}>
                    <Folder className="h-4 w-4" />
                    <span className="truncate flex items-center gap-2">
                      {project.name}
                      {mounted && project.id === activeProjectId && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px]">Active</Badge>
                      )}
                    </span>
                  </a>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem onClick={() => handleProjectClick(project.id)}>
                      <Folder className="text-muted-foreground h-4 w-4" />
                      <span>View Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                      <Share className="text-muted-foreground h-4 w-4" />
                      <span>Edit Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="text-muted-foreground h-4 w-4" />
                      <span>Delete Project</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )
          })
        )}
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => router.push("/projects")}>
            <MoreHorizontal className="h-4 w-4" />
            <span>View All Projects</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
