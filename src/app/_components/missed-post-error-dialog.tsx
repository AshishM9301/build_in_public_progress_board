"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, AlertCircle, RefreshCw } from "lucide-react"

interface MissedPostErrorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    missedDate: Date
    reason: string
    onCreateNewProject: () => void
}

export function MissedPostErrorDialog({
    open,
    onOpenChange,
    missedDate,
    reason,
    onCreateNewProject,
}: MissedPostErrorDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <DialogTitle>Missed Posting Date</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        You missed posting on a required date and cannot continue with this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">Missed Date</p>
                            <p className="text-sm text-muted-foreground">
                                {missedDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive font-medium">Why you can't post today:</p>
                        <p className="text-sm text-destructive/80 mt-1">{reason}</p>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">What you can do:</p>
                        <p className="text-sm text-blue-700 mt-1">
                            Create a new project to start fresh and maintain your streak commitment.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={onCreateNewProject}
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Create New Project
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
