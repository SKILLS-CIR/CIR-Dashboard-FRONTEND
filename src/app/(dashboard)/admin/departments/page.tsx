"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Department, SubDepartment } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Plus, Pencil, Trash2, Building2, Users } from "lucide-react"
import { toast } from "sonner"

export default function AdminDepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Department dialog state
    const [deptDialogOpen, setDeptDialogOpen] = useState(false)
    const [isEditingDept, setIsEditingDept] = useState(false)
    const [editingDeptId, setEditingDeptId] = useState<string | null>(null)
    const [deptName, setDeptName] = useState("")
    const [deptDescription, setDeptDescription] = useState("")
    const [isSavingDept, setIsSavingDept] = useState(false)

    // Sub-department dialog state
    const [subDeptDialogOpen, setSubDeptDialogOpen] = useState(false)
    const [isEditingSubDept, setIsEditingSubDept] = useState(false)
    const [editingSubDeptId, setEditingSubDeptId] = useState<string | null>(null)
    const [subDeptName, setSubDeptName] = useState("")
    const [subDeptDescription, setSubDeptDescription] = useState("")
    const [subDeptParentId, setSubDeptParentId] = useState("")
    const [isSavingSubDept, setIsSavingSubDept] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [depts, subDepts] = await Promise.all([
                api.departments.getAll(),
                api.subDepartments.getAll(),
            ])
            setDepartments(depts)
            setSubDepartments(subDepts)
        } catch (error) {
            console.error("Failed to fetch departments:", error)
            toast.error("Failed to load departments")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredDepartments = departments.filter(d =>
        d.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Department CRUD
    function openCreateDeptDialog() {
        setIsEditingDept(false)
        setEditingDeptId(null)
        setDeptName("")
        setDeptDescription("")
        setDeptDialogOpen(true)
    }

    function openEditDeptDialog(dept: Department) {
        setIsEditingDept(true)
        setEditingDeptId(dept.id)
        setDeptName(dept.name)
        setDeptDescription(dept.description || "")
        setDeptDialogOpen(true)
    }

    async function handleSaveDept() {
        if (!deptName.trim()) {
            toast.error("Department name is required")
            return
        }

        setIsSavingDept(true)
        try {
            if (isEditingDept && editingDeptId) {
                await api.departments.update(editingDeptId, {
                    name: deptName,
                    description: deptDescription || undefined,
                })
                toast.success("Department updated successfully")
            } else {
                await api.departments.create({
                    name: deptName,
                    description: deptDescription || undefined,
                })
                toast.success("Department created successfully")
            }
            setDeptDialogOpen(false)
            fetchData()
        } catch (error: any) {
            console.error("Failed to save department:", error)
            toast.error(error.message || "Failed to save department")
        } finally {
            setIsSavingDept(false)
        }
    }

    async function handleDeleteDept(id: string) {
        if (!confirm("Are you sure you want to delete this department? All sub-departments will also be deleted.")) return

        try {
            await api.departments.delete(id)
            toast.success("Department deleted successfully")
            fetchData()
        } catch (error) {
            console.error("Failed to delete department:", error)
            toast.error("Failed to delete department")
        }
    }

    // Sub-department CRUD
    function openCreateSubDeptDialog(parentDeptId?: string) {
        setIsEditingSubDept(false)
        setEditingSubDeptId(null)
        setSubDeptName("")
        setSubDeptDescription("")
        setSubDeptParentId(parentDeptId || "")
        setSubDeptDialogOpen(true)
    }

    function openEditSubDeptDialog(subDept: SubDepartment) {
        setIsEditingSubDept(true)
        setEditingSubDeptId(subDept.id)
        setSubDeptName(subDept.name)
        setSubDeptDescription(subDept.description || "")
        setSubDeptParentId(subDept.departmentId)
        setSubDeptDialogOpen(true)
    }

    async function handleSaveSubDept() {
        if (!subDeptName.trim()) {
            toast.error("Sub-department name is required")
            return
        }
        if (!subDeptParentId) {
            toast.error("Please select a parent department")
            return
        }

        setIsSavingSubDept(true)
        try {
            if (isEditingSubDept && editingSubDeptId) {
                await api.subDepartments.update(editingSubDeptId, {
                    name: subDeptName,
                    description: subDeptDescription || undefined,
                })
                toast.success("Sub-department updated successfully")
            } else {
                await api.subDepartments.create({
                    name: subDeptName,
                    description: subDeptDescription || undefined,
                    departmentId: subDeptParentId,
                })
                toast.success("Sub-department created successfully")
            }
            setSubDeptDialogOpen(false)
            fetchData()
        } catch (error: any) {
            console.error("Failed to save sub-department:", error)
            toast.error(error.message || "Failed to save sub-department")
        } finally {
            setIsSavingSubDept(false)
        }
    }

    async function handleDeleteSubDept(id: string) {
        if (!confirm("Are you sure you want to delete this sub-department?")) return

        try {
            await api.subDepartments.delete(id)
            toast.success("Sub-department deleted successfully")
            fetchData()
        } catch (error) {
            console.error("Failed to delete sub-department:", error)
            toast.error("Failed to delete sub-department")
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
                    <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
                    <p className="text-muted-foreground">
                        Manage departments and sub-departments
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openCreateSubDeptDialog()}>
                        <Plus className="h-4 w-4 mr-2" /> Add Sub-Department
                    </Button>
                    <Button onClick={openCreateDeptDialog}>
                        <Plus className="h-4 w-4 mr-2" /> Add Department
                    </Button>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search departments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Departments List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Departments</CardTitle>
                    <CardDescription>
                        {departments.length} department{departments.length !== 1 ? 's' : ''}, {' '}
                        {subDepartments.length} sub-department{subDepartments.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredDepartments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No departments found
                        </p>
                    ) : (
                        <Accordion type="multiple" className="w-full">
                            {filteredDepartments.map((dept) => {
                                const deptSubDepts = subDepartments.filter(sd => sd.departmentId === dept.id)
                                return (
                                    <AccordionItem key={dept.id} value={dept.id}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                                    <div className="text-left">
                                                        <p className="font-medium">{dept.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {deptSubDepts.length} sub-department{deptSubDepts.length !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openEditDeptDialog(dept)
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteDept(dept.id)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pl-8 space-y-3">
                                                {dept.description && (
                                                    <p className="text-sm text-muted-foreground">{dept.description}</p>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openCreateSubDeptDialog(dept.id)}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" /> Add Sub-Department
                                                </Button>
                                                {deptSubDepts.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground mt-2">No sub-departments yet</p>
                                                ) : (
                                                    <div className="space-y-2 mt-3">
                                                        {deptSubDepts.map((subDept) => (
                                                            <div
                                                                key={subDept.id}
                                                                className="flex items-center justify-between p-3 border rounded-lg"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                                    <div>
                                                                        <p className="font-medium">{subDept.name}</p>
                                                                        {subDept.description && (
                                                                            <p className="text-sm text-muted-foreground">{subDept.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openEditSubDeptDialog(subDept)}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-destructive"
                                                                        onClick={() => handleDeleteSubDept(subDept.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>
                    )}
                </CardContent>
            </Card>

            {/* Department Dialog */}
            <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditingDept ? 'Edit Department' : 'Create Department'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditingDept ? 'Update department details' : 'Add a new department to the organization'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="Enter department name"
                                value={deptName}
                                onChange={(e) => setDeptName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Enter department description (optional)"
                                value={deptDescription}
                                onChange={(e) => setDeptDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeptDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveDept} disabled={isSavingDept}>
                            {isSavingDept ? "Saving..." : isEditingDept ? "Save Changes" : "Create Department"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sub-Department Dialog */}
            <Dialog open={subDeptDialogOpen} onOpenChange={setSubDeptDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditingSubDept ? 'Edit Sub-Department' : 'Create Sub-Department'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditingSubDept ? 'Update sub-department details' : 'Add a new sub-department'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Parent Department <span className="text-red-500">*</span></Label>
                            <Select
                                value={subDeptParentId}
                                onValueChange={setSubDeptParentId}
                                disabled={isEditingSubDept}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select parent department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Name <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="Enter sub-department name"
                                value={subDeptName}
                                onChange={(e) => setSubDeptName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Enter sub-department description (optional)"
                                value={subDeptDescription}
                                onChange={(e) => setSubDeptDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSubDeptDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSubDept} disabled={isSavingSubDept}>
                            {isSavingSubDept ? "Saving..." : isEditingSubDept ? "Save Changes" : "Create Sub-Department"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
