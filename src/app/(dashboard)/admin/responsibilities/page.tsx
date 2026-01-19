"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Responsibility } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PriorityBadge } from "@/components/ui/status-badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminResponsibilitiesPage() {
    const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState<string>("MEDIUM")

    useEffect(() => {
        fetchResponsibilities()
    }, [])

    async function fetchResponsibilities() {
        try {
            const data = await api.responsibilities.getAll()
            setResponsibilities(data)
        } catch (error) {
            console.error("Failed to fetch responsibilities:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredResponsibilities = responsibilities.filter(r =>
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    async function handleCreate() {
        if (!title.trim()) {
            toast.error("Title is required")
            return
        }

        setIsCreating(true)
        try {
            await api.responsibilities.create({
                title,
                description: description || undefined,
                priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            })
            toast.success("Responsibility created successfully")
            setCreateDialogOpen(false)
            resetForm()
            fetchResponsibilities()
        } catch (error) {
            console.error("Failed to create responsibility:", error)
            toast.error("Failed to create responsibility")
        } finally {
            setIsCreating(false)
        }
    }

    function resetForm() {
        setTitle("")
        setDescription("")
        setPriority("MEDIUM")
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this responsibility?")) return

        try {
            await api.responsibilities.delete(id)
            toast.success("Responsibility deleted")
            fetchResponsibilities()
        } catch (error) {
            console.error("Failed to delete responsibility:", error)
            toast.error("Failed to delete responsibility")
        }
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Responsibilities</h1>
                    <p className="text-muted-foreground">
                        Manage work responsibility templates
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Add Responsibility
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Responsibility</DialogTitle>
                            <DialogDescription>
                                Define a new work responsibility template
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title *</Label>
                                <Input
                                    placeholder="Enter responsibility title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="Describe the responsibility..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="CRITICAL">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={isCreating}>
                                {isCreating ? "Creating..." : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search responsibilities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Responsibilities Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Responsibilities</CardTitle>
                    <CardDescription>
                        {filteredResponsibilities.length} responsibilit{filteredResponsibilities.length !== 1 ? 'ies' : 'y'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredResponsibilities.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No responsibilities found
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredResponsibilities.map((resp) => (
                                    <TableRow key={resp.id}>
                                        <TableCell className="font-medium">{resp.title}</TableCell>
                                        <TableCell className="max-w-[300px] truncate">
                                            {resp.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <PriorityBadge priority={resp.priority} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(resp.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
