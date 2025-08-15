"use client"

import { ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NavMainItemProps {
  item: {
    title: string
    url: string
    items?: Array<{
      title: string
      url: string
      isActive?: boolean
    }>
  }
}

export function NavMainItem({ item }: NavMainItemProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible defaultOpen={item.items?.some(subItem => subItem.isActive)}>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
            {item.items?.length ? (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : null}
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  )
}
