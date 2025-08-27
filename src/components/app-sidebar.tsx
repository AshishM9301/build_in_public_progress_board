"use client"

import { useState } from "react"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import { Sidebar, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Folder } from "lucide-react"
import { api } from "@/trpc/react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { data: projectsData } = api.project.getUserProjects.useQuery()
  const projects = projectsData?.projects ?? []

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
    </Sidebar>
  )
}
