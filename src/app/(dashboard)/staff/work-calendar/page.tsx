"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/components/providers/auth-context"
import { api } from "@/lib/api"
import { Assignment, WorkSubmission } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfToday } from "date-fns"
import {
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    Send,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    FileText,
    Lock,
    Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DayData {
    date: Date
    submissions: WorkSubmission[]
    totalHours: number
    hasVerified: boolean
    hasSubmitted: boolean
    hasRejected: boolean
    hasPending: boolean
}

export default function StaffWorkCalendarPage() {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [allSubmissions, setAllSubmissions] = useState<WorkSubmission[]>([])

    // Submission dialog state
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Create Responsibility dialog state
    const [createResponsibilityOpen, setCreateResponsibilityOpen] = useState(false)
    const [isCreatingResponsibility, setIsCreatingResponsibility] = useState(false)
    const [newResponsibilityTitle, setNewResponsibilityTitle] = useState("")
    const [newResponsibilityDescription, setNewResponsibilityDescription] = useState("")

    // Form state
    const [hoursWorked, setHoursWorked] = useState("")
    const [workDescription, setWorkDescription] = useState("")
    const [workProofType, setWorkProofType] = useState<"TEXT" | "PDF" | "IMAGE">("TEXT")
    const [workProofText, setWorkProofText] = useState("")
    const [workProofUrl, setWorkProofUrl] = useState("")

    const today = useMemo(() => startOfToday(), [])

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setIsLoading(true)
        try {
            const [assignmentsData, submissionsData] = await Promise.all([
                api.assignments.getAll(),
                api.workSubmissions.getAll(),
            ])
            setAssignments(assignmentsData)
            setAllSubmissions(submissionsData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load data")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleCreateResponsibility() {
        if (!newResponsibilityTitle.trim()) {
            toast.error("Title is required")
            return
        }

        if (!user?.id || !user?.subDepartmentId) {
            toast.error("User information is incomplete. Please log in again.")
            return
        }

        setIsCreatingResponsibility(true)
        try {
            // Get current cycle (YYYY-MM format)
            const now = new Date()
            const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

            console.log("Creating responsibility...", { title: newResponsibilityTitle, cycle })

            const result: any = await api.responsibilities.create({
                title: newResponsibilityTitle.trim(),
                description: newResponsibilityDescription.trim() || undefined,
                cycle,
                createdBy: { connect: { id: parseInt(user.id) } },
                subDepartment: { connect: { id: parseInt(user.subDepartmentId) } },
                isStaffCreated: true,
            })

            console.log("Responsibility created result:", result)
            toast.success("Responsibility created successfully!")

            // If work details are provided, submit work immediately
            if (hoursWorked && parseFloat(hoursWorked) > 0) {
                // Ensure assignments exist
                if (!result.assignments || result.assignments.length === 0) {
                    console.error("No assignments returned for new responsibility", result)
                    throw new Error("Responsibility created but assignment was not found.")
                }

                // Get assignment ID
                const assignmentId = result.assignments[0].id
                const numericAssignmentId = typeof assignmentId === 'string' ? parseInt(assignmentId) : assignmentId
                
                if (isNaN(numericAssignmentId)) {
                     throw new Error("Invalid Assignment ID received from server")
                }

                const payload = {
                    assignment: { connect: { id: numericAssignmentId } },
                    staff: { connect: { id: parseInt(user.id) } },
                    hoursWorked: parseFloat(hoursWorked),
                    staffComment: workDescription || undefined,
                    workProofType: workProofType,
                    workProofText: workProofType === 'TEXT' ? workProofText : undefined,
                    workProofUrl: workProofType !== 'TEXT' ? workProofUrl : undefined,
                    // Note: We omit workDate to let backend use server's 'today', avoiding timezone mismatch
                }

                console.log("Submitting work with payload:", payload)

                await api.workSubmissions.create(payload)
                toast.success("Work submitted successfully!")
            }

            setCreateResponsibilityOpen(false)
            setNewResponsibilityTitle("")
            setNewResponsibilityDescription("")
            // Reset work fields
            setHoursWorked("")
            setWorkDescription("")
            setWorkProofType("TEXT")
            setWorkProofText("")
            setWorkProofUrl("")

            await fetchData()
        } catch (error: any) {
            console.error("Failed to create responsibility/submission:", error)
            
            // Extract detailed error message
            let errorMessage = error.message || "Failed to create responsibility"
            if (error.response) {
                console.error("Backend Error Response:", error.response.data)
                if (error.response.data?.message) {
                    errorMessage = Array.isArray(error.response.data.message) 
                        ? error.response.data.message.join(', ') 
                        : error.response.data.message
                }
            }
            
            toast.error(errorMessage)
        } finally {
            setIsCreatingResponsibility(false)
        }
    }

    // Generate calendar days for current month
    const calendarDays = useMemo(() => {
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)
        return eachDayOfInterval({ start, end })
    }, [currentMonth])

    // Map submissions by date
    const dayDataMap = useMemo(() => {
        const map = new Map<string, DayData>()

        calendarDays.forEach(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const daySubmissions = allSubmissions.filter(s => {
                const workDate = new Date((s as any).workDate || s.submittedAt)
                return format(workDate, 'yyyy-MM-dd') === dateStr
            })

            const totalHours = daySubmissions.reduce((sum, s) => sum + ((s as any).hoursWorked || 0), 0)
            const hasVerified = daySubmissions.some(s => s.assignment?.status === 'VERIFIED' || s.status === 'VERIFIED')
            const hasSubmitted = daySubmissions.some(s => s.assignment?.status === 'SUBMITTED' || s.status === 'SUBMITTED')
            const hasRejected = daySubmissions.some(s => s.assignment?.status === 'REJECTED' || s.status === 'REJECTED')
            const hasPending = daySubmissions.some(s => s.assignment?.status === 'PENDING' || s.status === 'PENDING')

            map.set(dateStr, {
                date,
                submissions: daySubmissions,
                totalHours,
                hasVerified,
                hasSubmitted,
                hasRejected,
                hasPending,
            })
        })

        return map
    }, [calendarDays, allSubmissions])

    // Get assignments for selected date with their submission status
    // Get assignments for selected date with their submission status
    // Each assignment can have multiple submissions (one per day)
    const selectedDateAssignments = useMemo(() => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')

        return assignments.map(assignment => {
            // Check in assignment.workSubmissions (if available)
            let existingSubmission = assignment.workSubmissions?.find(s => {
                const workDate = new Date((s as any).workDate || s.submittedAt)
                return format(workDate, 'yyyy-MM-dd') === dateStr
            })

            // Fallback: Check in allSubmissions
            if (!existingSubmission) {
                existingSubmission = allSubmissions.find(s => {
                    const workDate = new Date((s as any).workDate || s.submittedAt)
                    const subAssignmentId = typeof s.assignmentId === 'string' ? parseInt(s.assignmentId) : s.assignmentId
                    const assignmentId = typeof assignment.id === 'string' ? parseInt(assignment.id) : assignment.id
                    return format(workDate, 'yyyy-MM-dd') === dateStr && subAssignmentId === assignmentId
                })
            }

            return {
                ...assignment,
                submissionForDate: existingSubmission || null,
            }
        })
    }, [selectedDate, assignments, allSubmissions])

    const isSelectedDateToday = useMemo(() => isSameDay(selectedDate, today), [selectedDate, today])
    const isSelectedDateLocked = useMemo(() => isBefore(selectedDate, today), [selectedDate, today])

    function getStatusBadge(assignment: typeof selectedDateAssignments[0]) {
        const status = assignment.submissionForDate?.assignment?.status || assignment.submissionForDate?.status || assignment.status

        switch (status) {
            case 'VERIFIED':
                return <Badge className="bg-green-600">Verified</Badge>
            case 'SUBMITTED':
                return <Badge className="bg-blue-600">Submitted</Badge>
            case 'REJECTED':
                return <Badge variant="destructive">Rejected</Badge>
            case 'IN_PROGRESS':
                return <Badge className="bg-yellow-600">In Progress</Badge>
            case 'PENDING':
            default:
                return <Badge variant="outline">Not Submitted</Badge>
        }
    }

    function getDayStatusColor(dateStr: string) {
        const dayData = dayDataMap.get(dateStr)
        if (!dayData || dayData.submissions.length === 0) return ""

        if (dayData.hasRejected && !dayData.hasVerified && !dayData.hasSubmitted) {
            return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
        }
        if (dayData.hasVerified && !dayData.hasSubmitted && !dayData.hasRejected) {
            return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
        }
        if (dayData.hasSubmitted) {
            return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
        }
        return "bg-gray-100 dark:bg-gray-800"
    }

    function openSubmitDialog(assignment: Assignment) {
        setSelectedAssignment(assignment)
        setHoursWorked("")
        setWorkDescription("")
        setWorkProofType("TEXT")
        setWorkProofText("")
        setWorkProofUrl("")
        setSubmitDialogOpen(true)
    }

    async function handleSubmitWork() {
        if (!selectedAssignment || !user?.id) return

        const hours = parseFloat(hoursWorked)
        if (isNaN(hours) || hours <= 0) {
            toast.error("Please enter valid hours worked")
            return
        }

        if (hours > 24) {
            toast.error("Hours cannot exceed 24")
            return
        }

        setIsSubmitting(true)
        try {
            const assignmentId = typeof selectedAssignment.id === 'string'
                ? parseInt(selectedAssignment.id)
                : selectedAssignment.id as number

            await api.workSubmissions.create({
                assignment: { connect: { id: assignmentId } },
                staff: { connect: { id: parseInt(user.id) } },
                hoursWorked: hours,
                staffComment: workDescription || undefined,
                workProofType: workProofType,
                workProofText: workProofType === 'TEXT' ? workProofText : undefined,
                workProofUrl: workProofType !== 'TEXT' ? workProofUrl : undefined,
            })

            toast.success("Work submitted successfully!")
            setSubmitDialogOpen(false)
            await fetchData()
        } catch (error: any) {
            console.error("Failed to submit work:", error)
            toast.error(error.message || "Failed to submit work")
        } finally {
            setIsSubmitting(false)
        }
    }

    function navigateMonth(direction: 'prev' | 'next') {
        const newMonth = new Date(currentMonth)
        if (direction === 'prev') {
            newMonth.setMonth(newMonth.getMonth() - 1)
        } else {
            newMonth.setMonth(newMonth.getMonth() + 1)
        }
        setCurrentMonth(newMonth)
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
                    <h1 className="text-3xl font-bold tracking-tight">Work Calendar</h1>
                    <p className="text-muted-foreground">
                        View your assignments and submit daily work
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Calendar */}
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="p-2 font-medium text-muted-foreground">
                                    {day}
                                </div>
                            ))}
                            {/* Empty cells for start of month */}
                            {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                                <div key={`empty-${i}`} className="p-2" />
                            ))}
                            {/* Calendar days */}
                            {calendarDays.map(date => {
                                const dateStr = format(date, 'yyyy-MM-dd')
                                const isSelected = isSameDay(date, selectedDate)
                                const isTodayDate = isToday(date)
                                const statusColor = getDayStatusColor(dateStr)
                                const dayData = dayDataMap.get(dateStr)

                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => setSelectedDate(date)}
                                        className={cn(
                                            "p-2 rounded-lg transition-all hover:bg-accent relative",
                                            isSelected && "ring-2 ring-primary ring-offset-2",
                                            isTodayDate && "font-bold",
                                            statusColor
                                        )}
                                    >
                                        {date.getDate()}
                                        {dayData && dayData.totalHours > 0 && (
                                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px]">
                                                {dayData.totalHours}h
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-green-500" />
                                <span>Verified</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-blue-500" />
                                <span>Submitted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-red-500" />
                                <span>Rejected</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Day Details */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Date Header */}
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                        {isSelectedDateToday && (
                                            <Badge variant="secondary">Today</Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        {isSelectedDateLocked ? (
                                            <>
                                                <Lock className="h-4 w-4" />
                                                This date is locked - view only
                                            </>
                                        ) : isSelectedDateToday ? (
                                            <>
                                                <Clock className="h-4 w-4" />
                                                Submit work for today's assignments
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="h-4 w-4" />
                                                Future date - cannot submit yet
                                            </>
                                        )}
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setCreateResponsibilityOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Responsibility
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Assignments */}
                    {selectedDateAssignments.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-4">
                                    No responsibilities assigned for this date.
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    You can create your own responsibilities for your manager to assign.
                                </p>
                                <Button variant="outline" onClick={() => setCreateResponsibilityOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Responsibility
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {selectedDateAssignments.map(assignment => {
                                const hasSubmission = !!assignment.submissionForDate
                                const canSubmit = isSelectedDateToday && !hasSubmission

                                return (
                                    <Card
                                        key={assignment.id}
                                        className={cn(
                                            hasSubmission && "border-l-4",
                                            assignment.submissionForDate?.assignment?.status === 'VERIFIED' && "border-l-green-500",
                                            assignment.submissionForDate?.assignment?.status === 'SUBMITTED' && "border-l-blue-500",
                                            assignment.submissionForDate?.assignment?.status === 'REJECTED' && "border-l-red-500"
                                        )}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-lg">
                                                        {assignment.responsibility?.title || 'Untitled Responsibility'}
                                                    </CardTitle>
                                                    {assignment.responsibility?.description && (
                                                        <CardDescription>
                                                            {assignment.responsibility.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                                {getStatusBadge(assignment)}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {hasSubmission ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            {(assignment.submissionForDate as any)?.hoursWorked || 0} hours
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            Submitted at {format(new Date(assignment.submissionForDate!.submittedAt), 'h:mm a')}
                                                        </span>
                                                    </div>
                                                    {assignment.submissionForDate?.staffComment && (
                                                        <div className="p-3 bg-muted rounded-lg text-sm">
                                                            <p className="font-medium mb-1">Your Comment:</p>
                                                            <p>{assignment.submissionForDate.staffComment}</p>
                                                        </div>
                                                    )}
                                                    {assignment.submissionForDate?.managerComment && (
                                                        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                                                            <p className="font-medium mb-1 text-blue-700 dark:text-blue-400">Manager Feedback:</p>
                                                            <p className="text-blue-600 dark:text-blue-300">{assignment.submissionForDate.managerComment}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-muted-foreground">
                                                        {isSelectedDateLocked
                                                            ? "No submission was made for this date"
                                                            : isSelectedDateToday
                                                                ? "Ready to submit your work"
                                                                : "Submit when this date arrives"
                                                        }
                                                    </p>
                                                    {canSubmit && (
                                                        <Button onClick={() => openSubmitDialog(assignment)}>
                                                            <Send className="h-4 w-4 mr-2" />
                                                            Submit Work
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Dialog */}
            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Submit Work</DialogTitle>
                        <DialogDescription>
                            {selectedAssignment?.responsibility?.title}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Hours Worked */}
                        <div className="space-y-2">
                            <Label htmlFor="hours">
                                Hours Worked <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="hours"
                                type="number"
                                min="0.5"
                                max="24"
                                step="0.5"
                                value={hoursWorked}
                                onChange={(e) => setHoursWorked(e.target.value)}
                                placeholder="Enter hours (e.g., 2.5)"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Work Description</Label>
                            <Textarea
                                id="description"
                                value={workDescription}
                                onChange={(e) => setWorkDescription(e.target.value)}
                                placeholder="Describe what you accomplished..."
                                rows={3}
                            />
                        </div>

                        {/* Proof Type */}
                        <div className="space-y-2">
                            <Label>Work Proof Type</Label>
                            <Select value={workProofType} onValueChange={(v: "TEXT" | "PDF" | "IMAGE") => setWorkProofType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TEXT">Text Description</SelectItem>
                                    <SelectItem value="PDF">PDF Document URL</SelectItem>
                                    <SelectItem value="IMAGE">Image URL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Proof Content */}
                        {workProofType === 'TEXT' ? (
                            <div className="space-y-2">
                                <Label htmlFor="proofText">Proof Details</Label>
                                <Textarea
                                    id="proofText"
                                    value={workProofText}
                                    onChange={(e) => setWorkProofText(e.target.value)}
                                    placeholder="Provide detailed proof of your work..."
                                    rows={3}
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="proofUrl">
                                    {workProofType === 'PDF' ? 'PDF' : 'Image'} URL
                                </Label>
                                <Input
                                    id="proofUrl"
                                    type="url"
                                    value={workProofUrl}
                                    onChange={(e) => setWorkProofUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitWork} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit Work
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Responsibility Dialog */}
            <Dialog open={createResponsibilityOpen} onOpenChange={setCreateResponsibilityOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create New Responsibility</DialogTitle>
                        <DialogDescription>
                            Create a new responsibility and optionally submit work for it immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="respTitle">
                                Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="respTitle"
                                value={newResponsibilityTitle}
                                onChange={(e) => setNewResponsibilityTitle(e.target.value)}
                                placeholder="e.g., Weekly Report Compilation"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="respDesc">Description</Label>
                            <Textarea
                                id="respDesc"
                                value={newResponsibilityDescription}
                                onChange={(e) => setNewResponsibilityDescription(e.target.value)}
                                placeholder="Describe the responsibility in detail..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="font-medium text-sm">Work Details (Optional - Submit Now)</h4>

                            <div className="space-y-2">
                                <Label htmlFor="respHours">
                                    Hours Worked <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="respHours"
                                    type="number"
                                    min="0.5"
                                    max="24"
                                    step="0.5"
                                    value={hoursWorked}
                                    onChange={(e) => setHoursWorked(e.target.value)}
                                    placeholder="Enter hours (e.g., 2.5)"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="respWorkDesc">Work Description</Label>
                                <Textarea
                                    id="respWorkDesc"
                                    value={workDescription}
                                    onChange={(e) => setWorkDescription(e.target.value)}
                                    placeholder="Describe what you accomplished..."
                                    rows={2}
                                />
                            </div>

                            {/* Proof Type */}
                            <div className="space-y-2">
                                <Label>Work Proof Type</Label>
                                <Select value={workProofType} onValueChange={(v: "TEXT" | "PDF" | "IMAGE") => setWorkProofType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEXT">Text Description</SelectItem>
                                        <SelectItem value="PDF">PDF Document URL</SelectItem>
                                        <SelectItem value="IMAGE">Image URL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Proof Content */}
                            {workProofType === 'TEXT' ? (
                                <div className="space-y-2">
                                    <Label htmlFor="respProofText">Proof Details</Label>
                                    <Textarea
                                        id="respProofText"
                                        value={workProofText}
                                        onChange={(e) => setWorkProofText(e.target.value)}
                                        placeholder="Proof details..."
                                        rows={2}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="respProofUrl">
                                        {workProofType === 'PDF' ? 'PDF' : 'Image'} URL
                                    </Label>
                                    <Input
                                        id="respProofUrl"
                                        type="url"
                                        value={workProofUrl}
                                        onChange={(e) => setWorkProofUrl(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateResponsibilityOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateResponsibility} disabled={isCreatingResponsibility}>
                            {isCreatingResponsibility ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create & Submit
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
