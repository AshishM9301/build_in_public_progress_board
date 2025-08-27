"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateProjectDialog } from "@/app/_components/create-project-dialog"

export function GlobalCreateProjectButton() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setIsDialogOpen(true)}
                size="lg"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 bg-primary hover:bg-primary/90 text-white"
                aria-label="Create new project"
            >
                <Plus className="h-6 w-6" />
            </Button>

            <CreateProjectDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </>
    )
}
