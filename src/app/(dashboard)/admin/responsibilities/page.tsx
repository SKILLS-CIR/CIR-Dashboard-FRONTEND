"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/components/providers/auth-context"
import { Responsibility, SubDepartment, Department, CreateResponsibilityDto } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Search, Plus, Pencil, Trash2, CalendarIcon, Building } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function AdminResponsibilitiesPage() {
    const { user } = useAuth()
    const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
    const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedFilterDept, setSelectedFilterDept] = useState<string>("all")
    const [selectedFilterSubDept, setSelectedFilterSubDept] = useState<string>("all")
    const [selectedFilterCycle, setSelectedFilterCycle] = useState<string>("all")
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // Form state - matches schema exactly
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [cycle, setCycle] = useState("")
    const [selectedSubDepartment, setSelectedSubDepartment] = useState("")
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)

    useEffect(() => {
        fetchData()
        // Auto-generate cycle from current month
        const now = new Date()
        setCycle(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    }, [])

    async function fetchData() {
        try {
            const [responsibilitiesData, subDepartmentsData, departmentsData] = await Promise.all([
                api.responsibilities.getAll(),
                api.subDepartments.getAll(),
                api.departments.getAll(),
            ])
            setResponsibilities(responsibilitiesData)
            setSubDepartments(subDepartmentsData)
            setDepartments(departmentsData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Get unique cycles from responsibilities
    const uniqueCycles = Array.from(new Set(responsibilities.map(r => r.cycle).filter(Boolean))).sort().reverse()

    // Filter sub-departments based on selected department for the filter
    const filteredSubDepartmentsForFilter = selectedFilterDept === "all"
        ? subDepartments
        : subDepartments.filter(sd => sd.departmentId === selectedFilterDept)

    const filteredResponsibilities = responsibilities.filter(r => {
        // Search filter
        const matchesSearch = searchQuery === "" ||
            r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase())

        // Department filter (check via subDepartment's departmentId)
        const matchesDept = selectedFilterDept === "all" ||
            r.subDepartment?.departmentId === selectedFilterDept ||
            subDepartments.find(sd => sd.id === r.subDepartmentId)?.departmentId === selectedFilterDept

        // Sub-department filter
        const matchesSubDept = selectedFilterSubDept === "all" ||
            r.subDepartmentId === selectedFilterSubDept ||
            r.subDepartment?.id === selectedFilterSubDept

        // Cycle filter
        const matchesCycle = selectedFilterCycle === "all" || r.cycle === selectedFilterCycle

        return matchesSearch && matchesDept && matchesSubDept && matchesCycle
    })

    async function handleCreate() {
        if (!title.trim()) {
            toast.error("Title is required")
            return
        }
        if (!cycle.trim() || !/^\d{4}-\d{2}$/.test(cycle)) {
            toast.error("Cycle must be in YYYY-MM format")
            return
        }
        if (!selectedSubDepartment) {
            toast.error("Sub-department is required")
            return
        }
        if (!user?.id) {
            toast.error("User authentication required")
            return
        }
        if (startDate && endDate && startDate > endDate) {
            toast.error("Start date must be before end date")
            return
        }

        setIsCreating(true)
        try {
            const payload: CreateResponsibilityDto = {
                title: title.trim(),
                cycle: cycle.trim(),
                createdBy: { connect: { id: parseInt(user.id) } },
                subDepartment: { connect: { id: parseInt(selectedSubDepartment) } },
                description: description.trim() || undefined,
                startDate: startDate ? startDate.toISOString() : undefined,
                endDate: endDate ? endDate.toISOString() : undefined,
            }

            await api.responsibilities.create(payload)
            toast.success("Responsibility created successfully")
            setCreateDialogOpen(false)
            resetForm()
            fetchData()
        } catch (error: any) {
            console.error("Failed to create responsibility:", error)
            toast.error(error.message || "Failed to create responsibility")
        } finally {
            setIsCreating(false)
        }
    }

    function resetForm() {
        setTitle("")
        setDescription("")
        const now = new Date()
        setCycle(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
        setSelectedSubDepartment("")
        setStartDate(undefined)
        setEndDate(undefined)
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this responsibility?")) return

        try {
            await api.responsibilities.delete(id)
            toast.success("Responsibility deleted")
            fetchData()
        } catch (error) {
            console.error("Failed to delete responsibility:", error)
            toast.error("Failed to delete responsibility")
        }
    }

    // Helper to get sub-department name by ID
    function getSubDepartmentName(subDeptId?: string): string {
        if (!subDeptId) return 'N/A'
        const subDept = subDepartments.find(sd => sd.id === subDeptId)
        return subDept?.name || 'N/A'
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
                        Manage work responsibilities across all sub-departments
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Create Responsibility
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Responsibility</DialogTitle>
                            <DialogDescription>
                                Create a new responsibility and assign it to a sub-department
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="Enter responsibility title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            {/* Cycle */}
                            <div className="space-y-2">
                                <Label htmlFor="cycle">
                                    Cycle (YYYY-MM) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="cycle"
                                    value={cycle}
                                    onChange={(e) => setCycle(e.target.value)}
                                    placeholder="e.g., 2026-01"
                                    pattern="\d{4}-\d{2}"
                                />
                                <p className="text-xs text-muted-foreground">
                                    The work cycle this responsibility belongs to
                                </p>
                            </div>

                            {/* Sub-Department */}
                            <div className="space-y-2">
                                <Label>
                                    Sub-Department <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedSubDepartment} onValueChange={setSelectedSubDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a sub-department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subDepartments.map((sd) => (
                                            <SelectItem key={sd.id} value={sd.id}>
                                                {sd.name} {sd.department?.name ? `(${sd.department.name})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Start Date */}
                            <div className="space-y-2">
                                <Label>Start Date (Optional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !startDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "PPP") : "Select start date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* End Date */}
                            <div className="space-y-2">
                                <Label>End Date (Optional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "PPP") : "Select end date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={setEndDate}
                                            disabled={(date) => startDate ? date < startDate : false}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the responsibility..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={isCreating}>
                                {isCreating ? "Creating..." : "Create Responsibility"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-3 flex-wrap">
                {/* Search Input */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search responsibilities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Department Filter */}
                <Select value={selectedFilterDept} onValueChange={(v) => {
                    setSelectedFilterDept(v)
                    setSelectedFilterSubDept("all") // Reset sub-department when department changes
                }}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Sub-Department Filter */}
                <Select value={selectedFilterSubDept} onValueChange={setSelectedFilterSubDept}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="All Sub-Departments" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sub-Departments</SelectItem>
                        {filteredSubDepartmentsForFilter.map((sd) => (
                            <SelectItem key={sd.id} value={sd.id}>
                                {sd.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Cycle Filter */}
                <Select value={selectedFilterCycle} onValueChange={setSelectedFilterCycle}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Cycles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Cycles</SelectItem>
                        {uniqueCycles.map((cycle) => (
                            <SelectItem key={cycle} value={cycle}>
                                {cycle}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

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
                                    <TableHead>Sub-Department</TableHead>
                                    <TableHead>Cycle</TableHead>
                                    <TableHead>Date Range</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredResponsibilities.map((resp) => (
                                    <TableRow key={resp.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{resp.title}</p>
                                                {resp.description && (
                                                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                        {resp.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Building className="h-3 w-3 text-muted-foreground" />
                                                {resp.subDepartment?.name || getSubDepartmentName(resp.subDepartmentId)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{resp.cycle || 'N/A'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {resp.startDate && resp.endDate ? (
                                                <span className="text-sm">
                                                    {format(new Date(resp.startDate), "MMM d")} - {format(new Date(resp.endDate), "MMM d, yyyy")}
                                                </span>
                                            ) : resp.startDate ? (
                                                <span className="text-sm">From {format(new Date(resp.startDate), "MMM d, yyyy")}</span>
                                            ) : resp.endDate ? (
                                                <span className="text-sm">Until {format(new Date(resp.endDate), "MMM d, yyyy")}</span>
                                            ) : (
                                                <span className="text-muted-foreground">No dates set</span>
                                            )}
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
