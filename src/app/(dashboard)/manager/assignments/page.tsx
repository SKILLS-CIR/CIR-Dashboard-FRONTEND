"use client"

import { useEffect, useState, useMemo } from "react"
import { api } from "@/lib/api"
import { Assignment, Responsibility, Employee, AssignmentStatus, ResponsibilityGroup } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search, FolderOpen, ChevronDown, User, Briefcase, Upload, FileText, Eye, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateResponsibilityDialog } from "@/components/manager/create-responsibility-dialog"
import BulkResponsibilitiesImport from "@/components/bulk-responsibilities-import"

const ITEMS_PER_PAGE = 10

export default function ManagerAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
    const [responsibilityGroups, setResponsibilityGroups] = useState<ResponsibilityGroup[]>([])
    const [staff, setStaff] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")

    // View mode for the assignments list
    const [viewMode, setViewMode] = useState<"all" | "groups" | "responsibilities">("all")

    // Responsibility management state
    const [viewingResponsibility, setViewingResponsibility] = useState<Responsibility | null>(null)
    const [editingResponsibility, setEditingResponsibility] = useState<Responsibility | null>(null)
    const [respViewDialogOpen, setRespViewDialogOpen] = useState(false)
    const [respEditDialogOpen, setRespEditDialogOpen] = useState(false)
    const [editRespTitle, setEditRespTitle] = useState("")
    const [editRespDescription, setEditRespDescription] = useState("")
    const [editRespCycle, setEditRespCycle] = useState("")
    const [editRespStartDate, setEditRespStartDate] = useState("")
    const [editRespEndDate, setEditRespEndDate] = useState("")
    const [isUpdatingResp, setIsUpdatingResp] = useState(false)
    const [respSearchQuery, setRespSearchQuery] = useState("")
    const [respCurrentPage, setRespCurrentPage] = useState(1)

    // Assignment mode: "single" or "group"
    const [assignmentMode, setAssignmentMode] = useState<"single" | "group">("single")

    // Form state for single responsibility create
    const [selectedResponsibility, setSelectedResponsibility] = useState("")
    const [selectedEmployee, setSelectedEmployee] = useState("")
    const [assignToAll, setAssignToAll] = useState(false)

    // Form state for group assignment
    const [selectedGroup, setSelectedGroup] = useState("")
    const [groupSelectedEmployee, setGroupSelectedEmployee] = useState("")
    const [groupAssignToAll, setGroupAssignToAll] = useState(false)

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
    const [editSelectedStaff, setEditSelectedStaff] = useState("")
    const [editAssignToAll, setEditAssignToAll] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    // Expanded groups in group view
    const [expandedViewGroups, setExpandedViewGroups] = useState<Set<string>>(new Set())

    // Expanded individual assignments sections in group view
    const [expandedIndividualSections, setExpandedIndividualSections] = useState<Set<string>>(new Set())

    // Expanded staff cards in group view
    const [expandedStaffCards, setExpandedStaffCards] = useState<Set<string>>(new Set())

    // Bulk import dialog state
    const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            // Helper to handle 404 gracefully for groups API
            const fetchGroupsSafe = async () => {
                try {
                    return await api.responsibilityGroups.getAll()
                } catch (error: any) {
                    // Only return empty array for 404 (endpoint not found)
                    if (error?.status === 404 || error?.response?.status === 404) {
                        return []
                    }
                    // Log and rethrow other errors (auth, network, etc.)
                    console.error("Failed to fetch responsibility groups:", error)
                    throw error
                }
            }

            const [assignmentsData, responsibilitiesData, employeesData, groupsData] = await Promise.all([
                api.assignments.getAll(),
                api.responsibilities.getAll({ includeExpired: true }),
                api.employees.getAll(),
                fetchGroupsSafe(),
            ])
            setAssignments(assignmentsData)
            setResponsibilities(responsibilitiesData)
            setStaff(employeesData.filter(e => e.role === 'STAFF'))
            setResponsibilityGroups(groupsData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Build a map of responsibility ID to group info
    const responsibilityToGroupMap = useMemo(() => {
        const map = new Map<string, { groupId: string; groupName: string }>()
        for (const group of responsibilityGroups) {
            if (!group.items) continue
            for (const item of group.items) {
                map.set(String(item.responsibilityId), {
                    groupId: group.id,
                    groupName: group.name,
                })
            }
        }
        return map
    }, [responsibilityGroups])

    // Group assignments by staff and their responsibility groups
    const groupedAssignmentsByStaff = useMemo(() => {
        const staffGroupMap = new Map<string, {
            staff: Employee | undefined
            groups: Map<string, {
                groupId: string
                groupName: string
                assignments: Assignment[]
            }>
            ungrouped: Assignment[]
        }>()

        for (const assignment of assignments) {
            const staffId = assignment.staffId || 'unknown'
            if (!staffGroupMap.has(staffId)) {
                staffGroupMap.set(staffId, {
                    staff: assignment.staff,
                    groups: new Map(),
                    ungrouped: [],
                })
            }

            const staffData = staffGroupMap.get(staffId)!
            const groupInfo = responsibilityToGroupMap.get(String(assignment.responsibilityId))

            if (groupInfo) {
                if (!staffData.groups.has(groupInfo.groupId)) {
                    staffData.groups.set(groupInfo.groupId, {
                        groupId: groupInfo.groupId,
                        groupName: groupInfo.groupName,
                        assignments: [],
                    })
                }
                staffData.groups.get(groupInfo.groupId)!.assignments.push(assignment)
            } else {
                staffData.ungrouped.push(assignment)
            }
        }

        return staffGroupMap
    }, [assignments, responsibilityToGroupMap])

    // Toggle group expansion in view
    const toggleViewGroupExpansion = (key: string) => {
        setExpandedViewGroups(prev => {
            const newSet = new Set(prev)
            if (newSet.has(key)) {
                newSet.delete(key)
            } else {
                newSet.add(key)
            }
            return newSet
        })
    }

    // Filtered and paginated assignments
    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => {
            const searchLower = searchQuery.toLowerCase()
            return (
                a.responsibility?.title?.toLowerCase().includes(searchLower) ||
                a.staff?.name?.toLowerCase().includes(searchLower)
            )
        })
    }, [assignments, searchQuery])

    const totalPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE)

    const paginatedAssignments = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredAssignments.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredAssignments, currentPage])

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    async function handleCreate() {
        if (assignmentMode === "group") {
            await handleGroupAssignment()
            return
        }

        // Single responsibility assignment (existing logic)
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

    async function handleGroupAssignment() {
        if (!selectedGroup) {
            toast.error("Please select a responsibility group")
            return
        }
        if (!groupAssignToAll && !groupSelectedEmployee) {
            toast.error("Please select an employee or choose 'Assign to All'")
            return
        }

        setIsCreating(true)
        try {
            const staffIds = groupAssignToAll
                ? staff.map(emp => parseInt(emp.id))
                : [parseInt(groupSelectedEmployee)]

            const result = await api.responsibilityGroups.assignToStaff(selectedGroup, {
                staffIds,
            })

            const groupName = responsibilityGroups.find(g => g.id === selectedGroup)?.name || 'Group'

            if (result.totalAssignmentsCreated > 0) {
                toast.success(
                    `"${groupName}" assigned successfully! ${result.totalAssignmentsCreated} assignment(s) created.${result.skippedDuplicates > 0 ? ` (${result.skippedDuplicates} already existed)` : ''
                    }`
                )
            } else if (result.skippedDuplicates > 0) {
                toast.info(`All responsibilities in "${groupName}" were already assigned to the selected staff.`)
            }

            setCreateDialogOpen(false)
            resetForm()
            fetchData()
        } catch (error: any) {
            console.error("Failed to assign group:", error)
            toast.error(error.message || "Failed to assign responsibility group")
        } finally {
            setIsCreating(false)
        }
    }

    function resetForm() {
        setSelectedResponsibility("")
        setSelectedEmployee("")
        setAssignToAll(false)
        setSelectedGroup("")
        setGroupSelectedEmployee("")
        setGroupAssignToAll(false)
        setAssignmentMode("single")
    }

    function openEditDialog(assignment: Assignment) {
        setEditingAssignment(assignment)
        setEditSelectedStaff(assignment.staffId || "")
        setEditAssignToAll(false)
        setEditDialogOpen(true)
    }

    async function handleUpdate() {
        if (!editingAssignment) return

        if (!editAssignToAll && !editSelectedStaff) {
            toast.error("Please select a staff member or choose 'Assign to All'")
            return
        }

        setIsUpdating(true)
        try {
            // Delete old assignment
            await api.assignments.delete(editingAssignment.id)

            if (editAssignToAll) {
                // Create assignment for all staff members
                for (const emp of staff) {
                    await api.assignments.create({
                        responsibility: { connect: { id: parseInt(editingAssignment.responsibilityId) } },
                        staff: { connect: { id: parseInt(emp.id) } },
                    })
                }
                toast.success(`Assigned to ${staff.length} staff members`)
            } else {
                // If same staff, recreate (no actual change but keeps consistent flow)
                await api.assignments.create({
                    responsibility: { connect: { id: parseInt(editingAssignment.responsibilityId) } },
                    staff: { connect: { id: parseInt(editSelectedStaff) } },
                })
                toast.success("Assignment reassigned successfully")
            }

            setEditDialogOpen(false)
            setEditingAssignment(null)
            fetchData()
        } catch (error) {
            console.error("Failed to update assignment:", error)
            toast.error("Failed to reassign")
        } finally {
            setIsUpdating(false)
        }
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

    // Responsibility CRUD handlers
    function openViewResponsibility(resp: Responsibility) {
        setViewingResponsibility(resp)
        setRespViewDialogOpen(true)
    }

    function openEditResponsibility(resp: Responsibility) {
        setEditingResponsibility(resp)
        setEditRespTitle(resp.title)
        setEditRespDescription(resp.description || "")
        setEditRespCycle(resp.cycle || "")
        setEditRespStartDate(resp.startDate ? resp.startDate.split('T')[0] : "")
        setEditRespEndDate(resp.endDate ? resp.endDate.split('T')[0] : "")
        setRespEditDialogOpen(true)
    }

    async function handleUpdateResponsibility() {
        if (!editingResponsibility) return
        if (!editRespTitle.trim()) {
            toast.error("Title is required")
            return
        }

        setIsUpdatingResp(true)
        try {
            await api.responsibilities.update(editingResponsibility.id, {
                title: editRespTitle.trim(),
                description: editRespDescription.trim() || undefined,
                cycle: editRespCycle || undefined,
                startDate: editRespStartDate ? new Date(editRespStartDate).toISOString() : undefined,
                endDate: editRespEndDate ? new Date(editRespEndDate).toISOString() : undefined,
            })
            toast.success("Responsibility updated successfully")
            setRespEditDialogOpen(false)
            setEditingResponsibility(null)
            fetchData()
        } catch (error: any) {
            console.error("Failed to update responsibility:", error)
            toast.error(error.message || "Failed to update responsibility")
        } finally {
            setIsUpdatingResp(false)
        }
    }

    async function handleDeleteResponsibility(id: string) {
        if (!confirm("Are you sure you want to delete this responsibility? This will also delete associated assignments.")) return

        try {
            await api.responsibilities.delete(id)
            toast.success("Responsibility deleted")
            fetchData()
        } catch (error: any) {
            console.error("Failed to delete responsibility:", error)
            toast.error(error.message || "Failed to delete responsibility")
        }
    }

    // Filtered and paginated responsibilities
    const filteredResponsibilities = useMemo(() => {
        return responsibilities.filter(r => {
            const searchLower = respSearchQuery.toLowerCase()
            return (
                r.title?.toLowerCase().includes(searchLower) ||
                r.description?.toLowerCase().includes(searchLower) ||
                r.cycle?.toLowerCase().includes(searchLower)
            )
        })
    }, [responsibilities, respSearchQuery])

    const respTotalPages = Math.ceil(filteredResponsibilities.length / ITEMS_PER_PAGE)

    const paginatedResponsibilities = useMemo(() => {
        const start = (respCurrentPage - 1) * ITEMS_PER_PAGE
        return filteredResponsibilities.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredResponsibilities, respCurrentPage])

    // Reset responsibility page when search changes
    useEffect(() => {
        setRespCurrentPage(1)
    }, [respSearchQuery])

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
                <div className="flex items-center gap-2">
                    {/* Create Responsibility Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Briefcase className="h-4 w-4 mr-2" />
                                Create Responsibility
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <CreateResponsibilityDialog
                                onSuccess={fetchData}
                                triggerButton={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Create Manually
                                    </DropdownMenuItem>
                                }
                            />
                            <DropdownMenuItem onSelect={() => setBulkImportDialogOpen(true)}>
                                <Upload className="h-4 w-4 mr-2" />
                                Bulk Import from CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Create Assignment Button */}
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" /> Assign Responsibility
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Create New Assignment</DialogTitle>
                                <DialogDescription>
                                    Assign a responsibility or responsibility group to staff
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                {/* Assignment Mode Toggle */}
                                <Tabs value={assignmentMode} onValueChange={(v) => setAssignmentMode(v as "single" | "group")}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="single">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Single Responsibility
                                        </TabsTrigger>
                                        <TabsTrigger value="group" disabled={responsibilityGroups.length === 0}>
                                            <FolderOpen className="h-4 w-4 mr-2" />
                                            Responsibility Group
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Single Responsibility Assignment */}
                                    <TabsContent value="single" className="space-y-4 mt-4">
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
                                    </TabsContent>

                                    {/* Group Assignment */}
                                    <TabsContent value="group" className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label>Responsibility Group *</Label>
                                            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a responsibility group" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {responsibilityGroups.map((group) => (
                                                        <SelectItem key={group.id} value={group.id}>
                                                            <div className="flex items-center gap-2">
                                                                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                                <span>{group.name}</span>
                                                                <span className="text-muted-foreground text-xs">
                                                                    ({group._count?.items || group.items?.length || 0} responsibilities)
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedGroup && (
                                                <div className="mt-2 p-3 bg-muted rounded-md">
                                                    <p className="text-sm font-medium mb-2">Responsibilities in this group:</p>
                                                    <ul className="text-sm text-muted-foreground space-y-1">
                                                        {responsibilityGroups
                                                            .find(g => g.id === selectedGroup)
                                                            ?.items?.map(item => (
                                                                <li key={item.id} className="flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50" />
                                                                    {item.responsibility?.title}
                                                                </li>
                                                            ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="groupAssignToAll"
                                                checked={groupAssignToAll}
                                                onChange={(e) => {
                                                    setGroupAssignToAll(e.target.checked)
                                                    if (e.target.checked) setGroupSelectedEmployee("")
                                                }}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <Label htmlFor="groupAssignToAll" className="text-sm font-medium">
                                                Assign to all staff members ({staff.length})
                                            </Label>
                                        </div>

                                        {!groupAssignToAll && (
                                            <div className="space-y-2">
                                                <Label>Assign To *</Label>
                                                <Select value={groupSelectedEmployee} onValueChange={setGroupSelectedEmployee}>
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

                                        {responsibilityGroups.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No responsibility groups available. Create a group first in the Responsibilities section.
                                            </p>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={isCreating}>
                                    {isCreating
                                        ? "Creating..."
                                        : assignmentMode === "group"
                                            ? "Assign Group"
                                            : "Create Assignment"
                                    }
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Search */}
            {/* <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by responsibility or staff name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card> */}

            {/* Assignments View */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Assignments</CardTitle>
                            <CardDescription>
                                {assignments.length} total assignments
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "all" | "groups" | "responsibilities")}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="groups">By Groups</TabsTrigger>
                            <TabsTrigger value="responsibilities">
                                <Briefcase className="h-4 w-4 mr-1" />
                                Responsibilities
                            </TabsTrigger>
                            <TabsTrigger value="all">All Assignments</TabsTrigger>
                        </TabsList>

                        {/* All Assignments View */}
                        <TabsContent value="all">
                            {filteredAssignments.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">
                                    {searchQuery ? "No assignments match your search." : "No assignments yet. Create one to get started."}
                                </p>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Responsibility</TableHead>
                                                <TableHead>Assigned To</TableHead>
                                                <TableHead>Group</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedAssignments.map((assignment) => {
                                                const groupInfo = responsibilityToGroupMap.get(String(assignment.responsibilityId))
                                                return (
                                                    <TableRow key={assignment.id}>
                                                        <TableCell className="font-medium">
                                                            {assignment.responsibility?.title || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>{assignment.staff?.name || 'Unknown'}</TableCell>
                                                        <TableCell>
                                                            {groupInfo ? (
                                                                <Badge variant="outline" className="gap-1">
                                                                    <FolderOpen className="h-3 w-3" />
                                                                    {groupInfo.groupName}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openEditDialog(assignment)}
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
                                                )
                                            })}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <p className="text-sm text-muted-foreground">
                                                Page {currentPage} of {totalPages}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        {/* By Groups View */}
                        <TabsContent value="groups">
                            {groupedAssignmentsByStaff.size === 0 ? (
                                <p className="text-muted-foreground text-center py-8">
                                    No assignments yet.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {Array.from(groupedAssignmentsByStaff.entries()).map(([staffId, data]) => (
                                        <Collapsible
                                            key={staffId}
                                            open={expandedStaffCards.has(staffId)}
                                            onOpenChange={() => {
                                                setExpandedStaffCards(prev => {
                                                    const newSet = new Set(prev)
                                                    if (newSet.has(staffId)) {
                                                        newSet.delete(staffId)
                                                    } else {
                                                        newSet.add(staffId)
                                                    }
                                                    return newSet
                                                })
                                            }}
                                            className="border rounded-lg"
                                        >
                                            {/* Staff Header - Clickable to expand */}
                                            <CollapsibleTrigger className="w-full flex items-center gap-3 p-4 bg-muted/30 hover:bg-muted/50 transition-colors rounded-lg">
                                                <Avatar className="h-20 w-20 ring-2 ring-primary/20 hover:ring-primary/40 transition-all border-2 border-background shadow-sm flex-shrink-0">
                                                    {data.staff?.avatarUrl ? (
                                                        <AvatarImage src={data.staff.avatarUrl} alt={data.staff.name || ''} />
                                                    ) : (
                                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold text-sm">
                                                            {data.staff?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div className="flex-1 text-left">
                                                    <h3 className="font-semibold">{data.staff?.name || 'Unknown Staff'}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {data.groups.size} group{data.groups.size !== 1 ? 's' : ''}, {data.ungrouped.length} individual
                                                    </p>
                                                </div>
                                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${expandedStaffCards.has(staffId) ? 'rotate-180' : ''}`} />
                                            </CollapsibleTrigger>

                                            <CollapsibleContent>
                                                <div className="p-4 space-y-3 border-t">
                                                    {/* Groups */}
                                                    {Array.from(data.groups.values()).map(group => {
                                                        const key = `${staffId}-${group.groupId}`
                                                        const isExpanded = expandedViewGroups.has(key)
                                                        return (
                                                            <Collapsible
                                                                key={key}
                                                                open={isExpanded}
                                                                onOpenChange={() => toggleViewGroupExpansion(key)}
                                                            >
                                                                <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                                                    <FolderOpen className="h-5 w-5 text-primary" />
                                                                    <div className="flex-1 text-left">
                                                                        <p className="font-medium">{group.groupName}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {group.assignments.length} responsibilit{group.assignments.length !== 1 ? 'ies' : 'y'}
                                                                        </p>
                                                                    </div>
                                                                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                                </CollapsibleTrigger>
                                                                <CollapsibleContent className="mt-2 ml-8 space-y-1">
                                                                    {group.assignments.map(assignment => (
                                                                        <div
                                                                            key={assignment.id}
                                                                            className="flex items-center justify-between p-2 text-sm border-l-2 border-muted pl-3"
                                                                        >
                                                                            <span>{assignment.responsibility?.title || 'N/A'}</span>
                                                                            <div className="flex gap-1">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-7 w-7 p-0"
                                                                                    onClick={() => openEditDialog(assignment)}
                                                                                >
                                                                                    <Pencil className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                                                    onClick={() => handleDelete(assignment.id)}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                        )
                                                    })}

                                                    {/* Ungrouped */}
                                                    {data.ungrouped.length > 0 && (
                                                        <Collapsible
                                                            open={expandedIndividualSections.has(staffId)}
                                                            onOpenChange={() => {
                                                                setExpandedIndividualSections(prev => {
                                                                    const newSet = new Set(prev)
                                                                    if (newSet.has(staffId)) {
                                                                        newSet.delete(staffId)
                                                                    } else {
                                                                        newSet.add(staffId)
                                                                    }
                                                                    return newSet
                                                                })
                                                            }}
                                                        >
                                                            <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                                <div className="flex-1 text-left">
                                                                    <p className="font-medium text-muted-foreground">Individual Assignments</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {data.ungrouped.length} responsibilit{data.ungrouped.length !== 1 ? 'ies' : 'y'}
                                                                    </p>
                                                                </div>
                                                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedIndividualSections.has(staffId) ? 'rotate-180' : ''}`} />
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent className="mt-2 ml-8 space-y-1">
                                                                {data.ungrouped.map(assignment => (
                                                                    <div
                                                                        key={assignment.id}
                                                                        className="flex items-center justify-between p-2 text-sm border-l-2 border-muted pl-3"
                                                                    >
                                                                        <span>{assignment.responsibility?.title || 'N/A'}</span>
                                                                        <div className="flex gap-1">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 w-7 p-0"
                                                                                onClick={() => openEditDialog(assignment)}
                                                                            >
                                                                                <Pencil className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                                                onClick={() => handleDelete(assignment.id)}
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </CollapsibleContent>
                                                        </Collapsible>
                                                    )}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Responsibilities Management Tab */}
                        <TabsContent value="responsibilities">
                            {/* Search for responsibilities */}
                            <div className="mb-4">
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search responsibilities..."
                                        value={respSearchQuery}
                                        onChange={(e) => setRespSearchQuery(e.target.value)}
                                        className="pl-8 h-9 text-sm"
                                    />
                                </div>
                            </div>

                            {filteredResponsibilities.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">
                                    {respSearchQuery ? "No responsibilities match your search." : "No responsibilities yet. Create one to get started."}
                                </p>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Cycle</TableHead>
                                                <TableHead>Date Range</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedResponsibilities.map((resp) => (
                                                <TableRow key={resp.id}>
                                                    <TableCell className="font-medium">
                                                        {resp.title}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate">
                                                        {resp.description || <span className="text-muted-foreground">—</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        {resp.cycle ? (
                                                            <Badge variant="outline">{resp.cycle}</Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {resp.startDate && resp.endDate ? (
                                                            <span className="text-sm">
                                                                {new Date(resp.startDate).toLocaleDateString()} - {new Date(resp.endDate).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openViewResponsibility(resp)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openEditResponsibility(resp)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDeleteResponsibility(resp.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination */}
                                    {respTotalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <p className="text-sm text-muted-foreground">
                                                Page {respCurrentPage} of {respTotalPages} ({filteredResponsibilities.length} responsibilities)
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setRespCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={respCurrentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setRespCurrentPage(p => Math.min(respTotalPages, p + 1))}
                                                    disabled={respCurrentPage === respTotalPages}
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reassign Task</DialogTitle>
                        <DialogDescription>
                            Change who this responsibility is assigned to
                        </DialogDescription>
                    </DialogHeader>

                    {editingAssignment && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Responsibility</Label>
                                <p className="font-medium">{editingAssignment.responsibility?.title || 'N/A'}</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Currently Assigned To</Label>
                                <p className="font-medium">{editingAssignment.staff?.name || 'Unknown'}</p>
                            </div>

                            {/* Assign to All Toggle */}
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="editAssignToAll"
                                    checked={editAssignToAll}
                                    onChange={(e) => {
                                        setEditAssignToAll(e.target.checked)
                                        if (e.target.checked) setEditSelectedStaff("")
                                    }}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="editAssignToAll" className="text-sm font-medium">
                                    Assign to all staff members ({staff.length})
                                </Label>
                            </div>

                            {!editAssignToAll && (
                                <div className="space-y-2">
                                    <Label>Reassign To *</Label>
                                    <Select value={editSelectedStaff} onValueChange={setEditSelectedStaff}>
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
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={isUpdating}>
                            {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Responsibility Dialog */}
            <Dialog open={respViewDialogOpen} onOpenChange={setRespViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            {viewingResponsibility?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Responsibility Details
                        </DialogDescription>
                    </DialogHeader>

                    {viewingResponsibility && (
                        <div className="space-y-4 py-2">
                            {viewingResponsibility.description && (
                                <div>
                                    <Label className="text-muted-foreground text-sm">Description</Label>
                                    <p className="mt-1">{viewingResponsibility.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground text-sm">Cycle</Label>
                                    <p className="mt-1">
                                        {viewingResponsibility.cycle ? (
                                            <Badge variant="outline">{viewingResponsibility.cycle}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">Not set</span>
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground text-sm">Date Range</Label>
                                    <p className="mt-1 text-sm">
                                        {viewingResponsibility.startDate && viewingResponsibility.endDate ? (
                                            `${new Date(viewingResponsibility.startDate).toLocaleDateString()} - ${new Date(viewingResponsibility.endDate).toLocaleDateString()}`
                                        ) : (
                                            <span className="text-muted-foreground">Not set</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-muted-foreground text-sm">Created</Label>
                                <p className="mt-1 text-sm">
                                    {viewingResponsibility.createdAt ? new Date(viewingResponsibility.createdAt).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRespViewDialogOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={() => {
                            setRespViewDialogOpen(false)
                            if (viewingResponsibility) openEditResponsibility(viewingResponsibility)
                        }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Responsibility Dialog */}
            <Dialog open={respEditDialogOpen} onOpenChange={setRespEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Responsibility</DialogTitle>
                        <DialogDescription>
                            Update the responsibility details
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                                value={editRespTitle}
                                onChange={(e) => setEditRespTitle(e.target.value)}
                                placeholder="Responsibility title"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={editRespDescription}
                                onChange={(e) => setEditRespDescription(e.target.value)}
                                placeholder="Optional description"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Cycle (YYYY-MM)</Label>
                            <Input
                                value={editRespCycle}
                                onChange={(e) => setEditRespCycle(e.target.value)}
                                placeholder="e.g. 2024-01"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={editRespStartDate}
                                    onChange={(e) => setEditRespStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={editRespEndDate}
                                    onChange={(e) => setEditRespEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRespEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateResponsibility} disabled={isUpdatingResp}>
                            {isUpdatingResp ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <Dialog open={bulkImportDialogOpen} onOpenChange={setBulkImportDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Bulk Import Responsibilities
                        </DialogTitle>
                        <DialogDescription>
                            Upload a CSV file to import multiple responsibilities at once
                        </DialogDescription>
                    </DialogHeader>
                    <BulkResponsibilitiesImport
                        onSuccess={() => {
                            setBulkImportDialogOpen(false)
                            fetchData()
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
