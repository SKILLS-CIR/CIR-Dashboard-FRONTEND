"use client"

import { useState, useMemo, useEffect } from "react"
import { format, subDays } from "date-fns"
import { Download, Calendar as CalendarIcon, Users, Building2, FileSpreadsheet, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface DateRange {
    from: Date
    to: Date
}

interface StaffMember {
    id: string | number
    name: string
    subDepartmentId?: string | number
    departmentId?: string | number
}

interface Department {
    id: string | number
    name: string
}

interface SubDepartment {
    id: string | number
    name: string
    departmentId?: string | number
}

interface Responsibility {
    id: string | number
    title: string
    description?: string
    subDepartmentId?: string | number
    isActive?: boolean
}

interface Assignment {
    id: string | number
    responsibilityId: string | number
    staffId: string | number
    responsibility?: Responsibility
}

interface WorkSubmission {
    id: string | number
    assignmentId: string | number
    staffId: string | number
    hoursWorked?: number
    workDate?: string
    workProofType?: 'PDF' | 'IMAGE' | 'TEXT'
    workProofUrl?: string
    workProofText?: string
    staffComment?: string
    managerComment?: string
    status: string
    submittedAt: string
    verifiedAt?: string
    description?: string
    remarks?: string
    assignment?: Assignment
}

// CSV Export utility with proper escaping
const exportToCSV = (data: Record<string, any>[], filename: string) => {
    if (data.length === 0) {
        alert('No data to export')
        return
    }
    
    const headers = Object.keys(data[0])
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header]
                if (value === null || value === undefined) return ''
                const strValue = String(value)
                if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n') || strValue.includes('\r')) {
                    return `"${strValue.replace(/"/g, '""')}"`
                }
                return strValue
            }).join(',')
        )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

// ============ STAFF EXPORT DIALOG ============
// Staff can only export their own data
interface StaffExportDialogProps {
    submissions: WorkSubmission[]
    responsibilities: Responsibility[]
    assignments: Assignment[]
    userName: string
}

export function StaffExportDialog({ submissions, responsibilities, assignments, userName }: StaffExportDialogProps) {
    const [open, setOpen] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })

    const handleExport = () => {
        const filteredSubmissions = submissions.filter(s => {
            const date = new Date(s.workDate || s.submittedAt)
            return date >= dateRange.from && date <= dateRange.to
        })

        if (filteredSubmissions.length === 0) {
            alert('No submissions found in the selected date range')
            return
        }

        // Export detailed submission data with all fields
        const data = filteredSubmissions.map(s => {
            // First try to get responsibility from nested assignment in submission
            // Then try separate lookup as fallback
            const nestedResponsibility = s.assignment?.responsibility
            const assignment = assignments.find(a => String(a.id) === String(s.assignmentId))
            const assignmentResponsibility = assignment?.responsibility
            const lookupResponsibility = responsibilities.find(r => String(r.id) === String(assignment?.responsibilityId))
            const responsibility = nestedResponsibility || assignmentResponsibility || lookupResponsibility
            
            return {
                SubmissionDate: format(new Date(s.workDate || s.submittedAt), 'yyyy-MM-dd'),
                ResponsibilityTitle: responsibility?.title || 'N/A',
                ResponsibilityDescription: responsibility?.description || '',
                HoursWorked: s.hoursWorked || 0,
                Status: s.status,
                WorkProofType: s.workProofType || '',
                WorkProofContent: s.workProofType === 'TEXT' 
                    ? (s.workProofText || '') 
                    : (s.workProofUrl || ''),
                StaffComment: s.staffComment || '',
                ManagerComment: s.managerComment || '',
                SubmittedAt: format(new Date(s.submittedAt), 'yyyy-MM-dd HH:mm'),
                VerifiedAt: s.verifiedAt ? format(new Date(s.verifiedAt), 'yyyy-MM-dd HH:mm') : '',
            }
        })

        exportToCSV(data, `my_submissions_${userName.replace(/\s+/g, '_')}`)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Export My Submissions
                    </DialogTitle>
                    <DialogDescription>
                        Export your detailed work submission data including responsibilities, hours, status, and comments
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Date Range */}
                    <div className="space-y-2">
                        <Label>Date Range</Label>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex-1 justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(dateRange.from, "MMM d, yyyy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.from}
                                        onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                                    />
                                </PopoverContent>
                            </Popover>
                            <span className="flex items-center text-muted-foreground">to</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex-1 justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(dateRange.to, "MMM d, yyyy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.to}
                                        onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>
                                Last 7 days
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>
                                Last 30 days
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}>
                                Last 90 days
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Export includes:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li>Submission date & responsibility details</li>
                            <li>Hours worked & submission status</li>
                            <li>Work proof type & content/URL</li>
                            <li>Staff & manager comments</li>
                        </ul>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ============ MANAGER EXPORT DIALOG ============
// Manager can export data for staff in their sub-department
interface ManagerExportDialogProps {
    submissions: WorkSubmission[]
    staffList: StaffMember[]
    responsibilities: Responsibility[]
    assignments: Assignment[]
    subDepartmentName: string
}

export function ManagerExportDialog({ 
    submissions, 
    staffList, 
    responsibilities, 
    assignments, 
    subDepartmentName 
}: ManagerExportDialogProps) {
    const [open, setOpen] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })
    const [selectedStaffId, setSelectedStaffId] = useState<string>("all")

    // Reset staff selection when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedStaffId("all")
        }
    }, [open])

    const handleExport = () => {
        // Filter by date range
        let filteredSubmissions = submissions.filter(s => {
            const date = new Date(s.workDate || s.submittedAt)
            return date >= dateRange.from && date <= dateRange.to
        })

        // Filter by selected staff
        if (selectedStaffId !== "all") {
            filteredSubmissions = filteredSubmissions.filter(s => String(s.staffId) === selectedStaffId)
        }

        if (filteredSubmissions.length === 0) {
            alert('No submissions found for the selected filters')
            return
        }

        // Export detailed submission data with all fields
        const data = filteredSubmissions.map(s => {
            const staff = staffList.find(st => String(st.id) === String(s.staffId))
            // First try to get responsibility from nested assignment in submission
            // Then try separate lookup as fallback
            const nestedResponsibility = s.assignment?.responsibility
            const assignment = assignments.find(a => String(a.id) === String(s.assignmentId))
            const assignmentResponsibility = assignment?.responsibility
            const lookupResponsibility = responsibilities.find(r => String(r.id) === String(assignment?.responsibilityId))
            const responsibility = nestedResponsibility || assignmentResponsibility || lookupResponsibility
            
            return {
                StaffName: staff?.name || 'Unknown',
                SubDepartment: subDepartmentName,
                SubmissionDate: format(new Date(s.workDate || s.submittedAt), 'yyyy-MM-dd'),
                ResponsibilityTitle: responsibility?.title || 'N/A',
                ResponsibilityDescription: responsibility?.description || '',
                HoursWorked: s.hoursWorked || 0,
                Status: s.status,
                WorkProofType: s.workProofType || '',
                WorkProofContent: s.workProofType === 'TEXT' 
                    ? (s.workProofText || '') 
                    : (s.workProofUrl || ''),
                StaffComment: s.staffComment || '',
                ManagerComment: s.managerComment || '',
                SubmittedAt: format(new Date(s.submittedAt), 'yyyy-MM-dd HH:mm'),
                VerifiedAt: s.verifiedAt ? format(new Date(s.verifiedAt), 'yyyy-MM-dd HH:mm') : '',
            }
        })

        // Generate filename based on selection
        let filename = 'submissions'
        if (selectedStaffId === "all") {
            filename = `all_staff_submissions_${subDepartmentName.replace(/\s+/g, '_')}`
        } else {
            const staffName = staffList.find(s => String(s.id) === selectedStaffId)?.name || 'staff'
            filename = `${staffName.replace(/\s+/g, '_')}_submissions`
        }

        exportToCSV(data, filename)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Export Team Submissions
                    </DialogTitle>
                    <DialogDescription>
                        Export detailed submission data for staff in {subDepartmentName}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Staff Selection - First filter */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Select Staff
                        </Label>
                        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <span className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        All Staff ({staffList.length})
                                    </span>
                                </SelectItem>
                                {staffList.map(staff => (
                                    <SelectItem key={staff.id} value={String(staff.id)}>
                                        <span className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {staff.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* Date Range */}
                    <div className="space-y-2">
                        <Label>Date Range</Label>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex-1 justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(dateRange.from, "MMM d, yyyy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.from}
                                        onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                                    />
                                </PopoverContent>
                            </Popover>
                            <span className="flex items-center text-muted-foreground">to</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex-1 justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(dateRange.to, "MMM d, yyyy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.to}
                                        onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>
                                Last 7 days
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>
                                Last 30 days
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}>
                                Last 90 days
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Export includes:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li>Staff name & submission date</li>
                            <li>Responsibility title & description</li>
                            <li>Hours worked & submission status</li>
                            <li>Work proof type & content/URL</li>
                            <li>Staff & manager comments</li>
                        </ul>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ============ ADMIN EXPORT DIALOG ============
// Admin can export data across all departments and sub-departments
interface AdminExportDialogProps {
    submissions: WorkSubmission[]
    employees: StaffMember[]
    departments: Department[]
    subDepartments: SubDepartment[]
    responsibilities: Responsibility[]
    assignments: Assignment[]
}

export function AdminExportDialog({ 
    submissions, 
    employees, 
    departments, 
    subDepartments, 
    responsibilities, 
    assignments 
}: AdminExportDialogProps) {
    const [open, setOpen] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all")
    const [selectedSubDepartmentId, setSelectedSubDepartmentId] = useState<string>("all")
    const [selectedStaffId, setSelectedStaffId] = useState<string>("all")

    // Filter sub-departments based on selected department
    const filteredSubDepartments = useMemo(() => {
        if (selectedDepartmentId === "all") return subDepartments
        return subDepartments.filter(sd => String(sd.departmentId) === selectedDepartmentId)
    }, [subDepartments, selectedDepartmentId])

    // Filter staff based on selected department/sub-department
    const filteredStaffList = useMemo(() => {
        let staff = employees.filter(e => (e as any).role === 'STAFF')
        if (selectedDepartmentId !== "all") {
            staff = staff.filter(e => String(e.departmentId) === selectedDepartmentId)
        }
        if (selectedSubDepartmentId !== "all") {
            staff = staff.filter(e => String(e.subDepartmentId) === selectedSubDepartmentId)
        }
        return staff
    }, [employees, selectedDepartmentId, selectedSubDepartmentId])

    // Reset cascading selections
    useEffect(() => {
        setSelectedSubDepartmentId("all")
        setSelectedStaffId("all")
    }, [selectedDepartmentId])

    useEffect(() => {
        setSelectedStaffId("all")
    }, [selectedSubDepartmentId])

    // Reset all selections when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedDepartmentId("all")
            setSelectedSubDepartmentId("all")
            setSelectedStaffId("all")
        }
    }, [open])

    const handleExport = () => {
        // Filter by date range
        let filteredSubmissions = submissions.filter(s => {
            const date = new Date(s.workDate || s.submittedAt)
            return date >= dateRange.from && date <= dateRange.to
        })

        // Apply department filter
        if (selectedDepartmentId !== "all") {
            const deptStaffIds = employees
                .filter(e => String(e.departmentId) === selectedDepartmentId)
                .map(e => String(e.id))
            filteredSubmissions = filteredSubmissions.filter(s => deptStaffIds.includes(String(s.staffId)))
        }

        // Apply sub-department filter
        if (selectedSubDepartmentId !== "all") {
            const subDeptStaffIds = employees
                .filter(e => String(e.subDepartmentId) === selectedSubDepartmentId)
                .map(e => String(e.id))
            filteredSubmissions = filteredSubmissions.filter(s => subDeptStaffIds.includes(String(s.staffId)))
        }

        // Apply staff filter
        if (selectedStaffId !== "all") {
            filteredSubmissions = filteredSubmissions.filter(s => String(s.staffId) === selectedStaffId)
        }

        if (filteredSubmissions.length === 0) {
            alert('No submissions found for the selected filters')
            return
        }

        // Export detailed submission data with all fields
        const data = filteredSubmissions.map(s => {
            const staff = employees.find(e => String(e.id) === String(s.staffId))
            const dept = departments.find(d => String(d.id) === String(staff?.departmentId))
            const subDept = subDepartments.find(sd => String(sd.id) === String(staff?.subDepartmentId))
            // First try to get responsibility from nested assignment in submission
            // Then try separate lookup as fallback
            const nestedResponsibility = s.assignment?.responsibility
            const assignment = assignments.find(a => String(a.id) === String(s.assignmentId))
            const assignmentResponsibility = assignment?.responsibility
            const lookupResponsibility = responsibilities.find(r => String(r.id) === String(assignment?.responsibilityId))
            const responsibility = nestedResponsibility || assignmentResponsibility || lookupResponsibility
            
            return {
                StaffName: staff?.name || 'Unknown',
                Department: dept?.name || '',
                SubDepartment: subDept?.name || '',
                SubmissionDate: format(new Date(s.workDate || s.submittedAt), 'yyyy-MM-dd'),
                ResponsibilityTitle: responsibility?.title || 'N/A',
                ResponsibilityDescription: responsibility?.description || '',
                HoursWorked: s.hoursWorked || 0,
                Status: s.status,
                WorkProofType: s.workProofType || '',
                WorkProofContent: s.workProofType === 'TEXT' 
                    ? (s.workProofText || '') 
                    : (s.workProofUrl || ''),
                StaffComment: s.staffComment || '',
                ManagerComment: s.managerComment || '',
                SubmittedAt: format(new Date(s.submittedAt), 'yyyy-MM-dd HH:mm'),
                VerifiedAt: s.verifiedAt ? format(new Date(s.verifiedAt), 'yyyy-MM-dd HH:mm') : '',
            }
        })

        // Generate filename based on selection
        let filename = 'submissions'
        if (selectedStaffId !== "all") {
            const staffName = employees.find(e => String(e.id) === selectedStaffId)?.name || 'staff'
            filename = `${staffName.replace(/\s+/g, '_')}_submissions`
        } else if (selectedSubDepartmentId !== "all") {
            const subDeptName = subDepartments.find(sd => String(sd.id) === selectedSubDepartmentId)?.name || 'subdept'
            filename = `${subDeptName.replace(/\s+/g, '_')}_submissions`
        } else if (selectedDepartmentId !== "all") {
            const deptName = departments.find(d => String(d.id) === selectedDepartmentId)?.name || 'dept'
            filename = `${deptName.replace(/\s+/g, '_')}_submissions`
        } else {
            filename = 'all_submissions'
        }

        exportToCSV(data, filename)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Export Organization Submissions
                    </DialogTitle>
                    <DialogDescription>
                        Export detailed submission data by department, sub-department, or individual staff
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Step 1: Department Selection */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Step 1: Select Department
                        </Label>
                        <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept.id} value={String(dept.id)}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Step 2: Sub-Department Selection (only visible after department selected) */}
                    {selectedDepartmentId !== "all" && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Step 2: Select Sub-Department
                            </Label>
                            <Select value={selectedSubDepartmentId} onValueChange={setSelectedSubDepartmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select sub-department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sub-Departments ({filteredSubDepartments.length})</SelectItem>
                                    {filteredSubDepartments.map(subDept => (
                                        <SelectItem key={subDept.id} value={String(subDept.id)}>
                                            {subDept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Step 3: Staff Selection (only visible after sub-department selected) */}
                    {selectedSubDepartmentId !== "all" && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Step 3: Select Staff
                            </Label>
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select staff member" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <span className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            All Staff ({filteredStaffList.length})
                                        </span>
                                    </SelectItem>
                                    {filteredStaffList.map(staff => (
                                        <SelectItem key={staff.id} value={String(staff.id)}>
                                            <span className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {staff.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Separator />

                    {/* Date Range */}
                    <div className="space-y-2">
                        <Label>Date Range</Label>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex-1 justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(dateRange.from, "MMM d, yyyy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.from}
                                        onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                                    />
                                </PopoverContent>
                            </Popover>
                            <span className="flex items-center text-muted-foreground">to</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex-1 justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(dateRange.to, "MMM d, yyyy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.to}
                                        onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>
                                Last 7 days
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>
                                Last 30 days
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}>
                                Last 90 days
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Export includes:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li>Staff name, department & sub-department</li>
                            <li>Responsibility title & description</li>
                            <li>Submission date, hours worked & status</li>
                            <li>Work proof type & content/URL</li>
                            <li>Staff & manager comments</li>
                        </ul>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
