"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { api } from "@/trpc/react"

export default function ProjectsPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const { data: projectsData, isLoading } = api.project.getUserProjects.useQuery()
    const projects = projectsData?.projects ?? []

    // Filter projects based on search term
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.categories.some(cat =>
            cat.category.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )

    // Pagination
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage)

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

    const getStreakProgress = (project: any) => {
        const totalDays = project.targetStreakDays
        const completedDays = project.streakChallenges?.filter((challenge: any) =>
            challenge.isCompleted
        ).length ?? 0

        return `${completedDays}/${totalDays}`
    }

    const getStatusColor = (project: any) => {
        const totalDays = project.targetStreakDays
        const completedDays = project.streakChallenges?.filter((challenge: any) =>
            challenge.isCompleted
        ).length ?? 0

        if (completedDays === totalDays) return "bg-green-100 text-green-800"
        if (completedDays > 0) return "bg-blue-100 text-blue-800"
        return "bg-gray-100 text-gray-800"
    }

    const getStatusText = (project: any) => {
        const totalDays = project.targetStreakDays
        const completedDays = project.streakChallenges?.filter((challenge: any) =>
            challenge.isCompleted
        ).length ?? 0

        if (completedDays === totalDays) return "Completed"
        if (completedDays > 0) return "In Progress"
        return "Not Started"
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-lg">Loading projects...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">
                        Manage your build-in-public projects and track your progress
                    </p>
                </div>
                <Button
                    onClick={() => document.dispatchEvent(new CustomEvent('openCreateProject'))}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Project
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search projects, categories, or descriptions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Projects Table */}
            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Categories</TableHead>
                            <TableHead>Streak Progress</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedProjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="text-muted-foreground">
                                        {searchTerm ? "No projects found matching your search." : "No projects yet. Create your first project to get started!"}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedProjects.map((project) => (
                                <TableRow
                                    key={project.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleProjectClick(project.id)}
                                >
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{project.name}</div>
                                            {project.description && (
                                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                    {project.description}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {project.categories.map((cat: any) => (
                                                <Badge
                                                    key={cat.category.id}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {cat.category.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {getStreakProgress(project)} days
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={getStatusColor(project)}
                                        >
                                            {getStatusText(project)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleProjectClick(project.id)
                                                }}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEditProject(project.id)
                                                }}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteProject(project.id)
                                                }}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        onClick={() => setCurrentPage(page)}
                                        isActive={currentPage === page}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    )
}
