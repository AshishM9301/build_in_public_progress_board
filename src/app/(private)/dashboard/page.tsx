import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { ProgressBoard } from "@/app/_components/progress-board"

export default function DashboardPage() {
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 px-4">
                <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="#">
                                Build in Public
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbList>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Progress Board</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <ProgressBoard />
            </div>
        </>
    )
}
