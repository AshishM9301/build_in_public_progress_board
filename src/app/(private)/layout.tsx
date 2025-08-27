import { AppSidebar } from "@/components/app-sidebar"
import { GlobalCreateProjectButton } from "@/components/global-create-project-button"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"

export default function PrivateLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "19rem",
                } as React.CSSProperties
            }
        >
            <AppSidebar />
            <SidebarInset className="border">
                <header className="flex h-16 shrink-0 items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                </header>
                <div className="flex flex-1 flex-col">
                    {children}
                </div>
            </SidebarInset>
            <GlobalCreateProjectButton />
        </SidebarProvider>
    )
}
