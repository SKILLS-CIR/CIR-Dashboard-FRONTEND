"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-context"
import { api } from "@/lib/api"
import { Responsibility, SubDepartment } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import {
    Plus,
    RefreshCw,
    FileText,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react"

export default function StaffResponsibilitiesPage() {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")

    useEffect(() => {
        fetchResponsibilities()
    }, [])

    async function fetchResponsibilities() {
        setIsLoading(true)
        try {
            const data = await api.responsibilities.getAll()
            // Filter to show only staff-created responsibilities for this user
            const staffResponsibilities = data.filter(
                (r) => r.isStaffCreated && r.createdById === user?.id
            )
            setResponsibilities(staffResponsibilities)
        } catch (error) {
            console.error("Failed to fetch responsibilities:", error)
            toast.error("Failed to load responsibilities")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleCreateResponsibility() {
        if (!title.trim()) {
            toast.error("Title is required")
            return
        }

        if (!user?.id || !user?.subDepartmentId) {
            toast.error("User information is incomplete. Please log in again.")
            return
        }

        setIsSubmitting(true)
        try {
            // Get current cycle (YYYY-MM format)
            const now = new Date()
            const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

            await api.responsibilities.create({
                title: title.trim(),
                description: description.trim() || undefined,
                cycle,
                createdBy: { connect: { id: parseInt(user.id) } },
                subDepartment: { connect: { id: parseInt(user.subDepartmentId) } },
                isStaffCreated: true,
            })

            toast.success("Responsibility created successfully!")
            setIsDialogOpen(false)
            resetForm()
            await fetchResponsibilities()
        } catch (error: any) {
            console.error("Failed to create responsibility:", error)
            toast.error(error.message || "Failed to create responsibility")
        } finally {
            setIsSubmitting(false)
        }
    }

    function resetForm() {
        setTitle("")
        setDescription("")
    }

    function getStatusBadge(responsibility: Responsibility) {
        const now = new Date()
        const startDate = responsibility.startDate ? new Date(responsibility.startDate) : null
        const endDate = responsibility.endDate ? new Date(responsibility.endDate) : null

        if (endDate && now > endDate) {
            return <Badge variant="secondary">Expired</Badge>
        }
        if (startDate && now < startDate) {
            return <Badge variant="outline">Upcoming</Badge>
        }
        if (responsibility.isActive) {
            return <Badge variant="default" className="bg-green-600">Active</Badge>
        }
        return <Badge variant="secondary">Inactive</Badge>
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Responsibilities</h1>
                    <p className="text-muted-foreground">
                        Create and manage your own daily responsibilities
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchResponsibilities}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Responsibility
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create New Responsibility</DialogTitle>
                                <DialogDescription>
                                    Add a personal responsibility to track your daily work.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Enter responsibility title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe what this responsibility involves..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                                    <p className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        This responsibility will be created for the current month.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsDialogOpen(false)
                                        resetForm()
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateResponsibility} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-lg">
                        <FileText className="h-5 w-5" />
                        About Personal Responsibilities
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-700 dark:text-blue-300">
                    <ul className="list-disc list-inside space-y-1">
                        <li>Create responsibilities to track work that isn't assigned by your manager</li>
                        <li>Personal responsibilities appear alongside assigned tasks in your daily work</li>
                        <li>Your manager can see and verify work submitted against these responsibilities</li>
                    </ul>
                </CardContent>
            </Card>

            {/* Responsibilities Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Responsibilities</CardTitle>
                    <CardDescription>
                        {responsibilities.length === 0
                            ? "You haven't created any personal responsibilities yet."
                            : `You have ${responsibilities.length} personal responsibilit${responsibilities.length === 1 ? 'y' : 'ies'}.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {responsibilities.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium text-lg mb-2">No Responsibilities Yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first personal responsibility to start tracking additional work.
                            </p>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Responsibility
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Cycle</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {responsibilities.map((responsibility) => (
                                    <TableRow key={responsibility.id}>
                                        <TableCell className="font-medium">
                                            {responsibility.title}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {responsibility.description || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{responsibility.cycle}</Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(responsibility)}</TableCell>
                                        <TableCell>
                                            {format(new Date(responsibility.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
