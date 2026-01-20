"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Assignment, Responsibility, Employee } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AssignmentStatusBadge } from "@/components/ui/status-badge"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function ManagerAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
    const [staff, setStaff] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // Form state - NO due date (not in schema for assignments from manager)
    const [selectedResponsibility, setSelectedResponsibility] = useState("")
    const [selectedEmployee, setSelectedEmployee] = useState("")
    const [assignToAll, setAssignToAll] = useState(false)
    const [notes, setNotes] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [assignmentsData, responsibilitiesData, employeesData] = await Promise.all([
                api.assignments.getAll(),
                api.responsibilities.getAll(),
                api.employees.getAll(),
            ])
            setAssignments(assignmentsData)
            setResponsibilities(responsibilitiesData)
            setStaff(employeesData.filter(e => e.role === 'STAFF'))
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleCreate() {
        if (!selectedResponsibility) {
            toast.error("Please select a responsibility")
            return
        }
        if (!assignToAll && !selectedEmployee) {
            toast.error("Please select an employee or choose 'Assign to All'")
            return
        }

        setIsCreating(true)
        try {
            if (assignToAll) {
                // Create assignment for all staff members
                for (const emp of staff) {
                    await api.assignments.create({
                        responsibility: { connect: { id: parseInt(selectedResponsibility) } },
                        staff: { connect: { id: parseInt(emp.id) } },
                    })
                }
                toast.success(`Assignment created for ${staff.length} staff members`)
            } else {
                await api.assignments.create({
                    responsibility: { connect: { id: parseInt(selectedResponsibility) } },
                    staff: { connect: { id: parseInt(selectedEmployee) } },
                })
                toast.success("Assignment created successfully")
            }
            setCreateDialogOpen(false)
            resetForm()
            fetchData()
        } catch (error) {
            console.error("Failed to create assignment:", error)
            toast.error("Failed to create assignment")
        } finally {
            setIsCreating(false)
        }
    }

    function resetForm() {
        setSelectedResponsibility("")
        setSelectedEmployee("")
        setAssignToAll(false)
        setNotes("")
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this assignment?")) return

        try {
            await api.assignments.delete(id)
            toast.success("Assignment deleted")
            fetchData()
        } catch (error) {
            console.error("Failed to delete assignment:", error)
            toast.error("Failed to delete assignment")
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
                    <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
                    <p className="text-muted-foreground">
                        Create and manage work assignments for your team
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Create Assignment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Assignment</DialogTitle>
                            <DialogDescription>
                                Assign a responsibility to a staff member
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Responsibility *</Label>
                                <Select value={selectedResponsibility} onValueChange={setSelectedResponsibility}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a responsibility" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {responsibilities.map((resp) => (
                                            <SelectItem key={resp.id} value={resp.id}>
                                                {resp.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Assign to All Toggle */}
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="assignToAll"
                                    checked={assignToAll}
                                    onChange={(e) => {
                                        setAssignToAll(e.target.checked)
                                        if (e.target.checked) setSelectedEmployee("")
                                    }}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="assignToAll" className="text-sm font-medium">
                                    Assign to all staff members ({staff.length})
                                </Label>
                            </div>

                            {!assignToAll && (
                                <div className="space-y-2">
                                    <Label>Assign To *</Label>
                                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a staff member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {staff.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                    placeholder="Additional notes or instructions..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={isCreating}>
                                {isCreating ? "Creating..." : "Create Assignment"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Assignments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Assignments</CardTitle>
                    <CardDescription>
                        {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {assignments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No assignments yet. Create one to get started.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Responsibility</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.map((assignment) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell className="font-medium">
                                            {assignment.responsibility?.title || 'N/A'}
                                        </TableCell>
                                        <TableCell>{assignment.staff?.name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <AssignmentStatusBadge status={assignment.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => {
                                                        // Edit functionality - could open edit dialog
                                                        toast.info("Edit feature coming soon")
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(assignment.id)}
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
