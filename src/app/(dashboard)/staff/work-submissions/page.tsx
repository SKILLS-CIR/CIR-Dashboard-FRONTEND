"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { WorkSubmission, DayStatus } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SubmissionStatusBadge, DayStatusBadge } from "@/components/ui/status-badge"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { 
    FileCheck, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    ArrowLeft,
    ChevronRight,
    CalendarIcon,
    X
} from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import { getDayStatus } from "@/lib/responsibility-status"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DayGroup {
    date: string
    displayDate: string
    status: DayStatus
    totalHours: number
    verifiedHours: number
    submissions: WorkSubmission[]
}

const ITEMS_PER_PAGE = 10

export default function StaffWorkSubmissionsPage() {
    const router = useRouter()
    const [allSubmissions, setAllSubmissions] = useState<WorkSubmission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [currentPage, setCurrentPage] = useState(1)
 
    useEffect(() => {
        async function fetchSubmissions() {
            try {
                const data = await api.workSubmissions.getAll()
                setAllSubmissions(data)
            } catch (error) {
                console.error("Failed to fetch submissions:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSubmissions()
    }, [])

    // Filter submissions based on selected date
    const filteredSubmissions = useMemo(() => {
        if (!selectedDate) {
            return allSubmissions
        }
        
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        return allSubmissions.filter(s => {
            const submissionDate = new Date((s as any).workDate || s.submittedAt)
            return format(submissionDate, 'yyyy-MM-dd') === dateStr
        })
    }, [allSubmissions, selectedDate])

    // Group submissions by date
    const groupedByDay = useMemo((): DayGroup[] => {
        const dayMap = new Map<string, DayGroup>()
        
        filteredSubmissions.forEach(submission => {
            const workDate = (submission as any).workDate || submission.submittedAt
            const dateStr = format(new Date(workDate), 'yyyy-MM-dd')
            
            if (!dayMap.has(dateStr)) {
                dayMap.set(dateStr, {
                    date: dateStr,
                    displayDate: new Date(dateStr).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    status: 'NOT_SUBMITTED',
                    totalHours: 0,
                    verifiedHours: 0,
                    submissions: []
                })
            }
            
            const day = dayMap.get(dateStr)!
            day.submissions.push(submission)
            day.totalHours += (submission as any).hoursWorked || 0
            
            // Use the submission's own status for THIS date
            const status = submission.status || submission.assignment?.status
            if (status === 'VERIFIED') {
                day.verifiedHours += (submission as any).hoursWorked || 0
            }
        })
        
        // Calculate day status using shared utility
        dayMap.forEach((day) => {
            day.status = getDayStatus(day.submissions)
        })
        
        // Sort by date descending
        return Array.from(dayMap.values()).sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
    }, [filteredSubmissions])

    // Paginate grouped days
    const paginatedDays = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        return groupedByDay.slice(startIndex, endIndex)
    }, [groupedByDay, currentPage])

    const totalPages = Math.ceil(groupedByDay.length / ITEMS_PER_PAGE)

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedDate])

    const toggleDayExpanded = (date: string) => {
        setExpandedDays(prev => {
            const next = new Set(prev)
            if (next.has(date)) {
                next.delete(date)
            } else {
                next.add(date)
            }
            return next
        })
    }

    const clearDateFilter = () => {
        setSelectedDate(undefined)
    }

    // Stats - Use submission status directly (date-specific)
    const stats = useMemo(() => {
        // Count based on submission's own status
        const pending = filteredSubmissions.filter(s => (s.status || s.assignment?.status) === 'PENDING')
        const submitted = filteredSubmissions.filter(s => (s.status || s.assignment?.status) === 'SUBMITTED')
        const verified = filteredSubmissions.filter(s => (s.status || s.assignment?.status) === 'VERIFIED')
        const rejected = filteredSubmissions.filter(s => (s.status || s.assignment?.status) === 'REJECTED')
        
        return {
            pending: pending.length,
            submitted: submitted.length,
            verified: verified.length,
            rejected: rejected.length,
            totalDays: groupedByDay.length,
            verifiedDays: groupedByDay.filter(d => d.status === 'VERIFIED').length,
        }
    }, [filteredSubmissions, groupedByDay])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* <DashboardHeader/> */}
            
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/staff')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Work History</h1>
                    <p className="text-muted-foreground">
                        View all your daily work submissions
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <p className="text-sm font-medium">Filter by date:</p>
                        
                        {/* Date Picker */}
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-[240px] justify-start text-left font-normal",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            
                            {selectedDate && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearDateFilter}
                                    className="h-9 w-9"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {selectedDate && (
                            <p className="text-sm text-muted-foreground">
                                Showing submissions for {format(selectedDate, "PPP")}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Rejected Alert */}
            {stats.rejected > 0 && (
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            {stats.rejected} Rejected Submission{stats.rejected > 1 ? 's' : ''} Need Attention
                        </CardTitle>
                        <CardDescription className="text-red-600 dark:text-red-400">
                            Please review rejected items and contact your manager for queries.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {/* Daily Groups */}
            <Card>
                <CardHeader>
                    <CardTitle>Submission History by Day</CardTitle>
                    <CardDescription>
                        {groupedByDay.length} day{groupedByDay.length !== 1 ? 's' : ''} with work submissions
                        {selectedDate && ` (filtered)`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {groupedByDay.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                {selectedDate 
                                    ? `No submissions found for ${format(selectedDate, "PPP")}`
                                    : "No submissions yet. Go to your dashboard to submit today's work."
                                }
                            </p>
                            {selectedDate ? (
                                <Button className="mt-4" onClick={clearDateFilter}>
                                    Clear Filter
                                </Button>
                            ) : (
                                <Button className="mt-4" onClick={() => router.push('/staff')}>
                                    Go to Dashboard
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {paginatedDays.map((day) => (
                                    <div key={day.date} className="border rounded-lg overflow-hidden">
                                        {/* Day Header */}
                                        <button
                                            onClick={() => toggleDayExpanded(day.date)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <DayStatusBadge status={day.status} />
                                                <div className="text-left">
                                                    <p className="font-medium">{day.displayDate}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {day.submissions.length} submission{day.submissions.length !== 1 ? 's' : ''} • {day.totalHours} total hours
                                                        {day.verifiedHours > 0 && ` • ${day.verifiedHours} verified`}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className={`h-5 w-5 transition-transform ${expandedDays.has(day.date) ? 'rotate-90' : ''}`} />
                                        </button>
                                        
                                        {/* Expanded Submissions */}
                                        {expandedDays.has(day.date) && (
                                            <div className="border-t bg-muted/30 p-4 space-y-3">
                                                {day.submissions.map((submission) => {
                                                    // Use submission.status FIRST (per-submission status from DB)
                                                    // Only fall back to assignment.status for legacy data
                                                    const status = submission.status || submission.assignment?.status || 'SUBMITTED'
                                                    return (
                                                        <div
                                                            key={submission.id}
                                                            className="flex items-center justify-between p-3 bg-background rounded-lg border"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                                                    status === 'VERIFIED' ? 'bg-green-100 dark:bg-green-900' :
                                                                    status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900' :
                                                                    status === 'SUBMITTED' ? 'bg-blue-100 dark:bg-blue-900' :
                                                                    'bg-amber-100 dark:bg-amber-900'
                                                                }`}>
                                                                    {status === 'VERIFIED' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                                                    {status === 'REJECTED' && <XCircle className="h-4 w-4 text-red-600" />}
                                                                    {status === 'SUBMITTED' && <FileCheck className="h-4 w-4 text-blue-600" />}
                                                                    {status === 'PENDING' && <Clock className="h-4 w-4 text-amber-600" />}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm">
                                                                        {submission.assignment?.responsibility?.title || 'Work Submission'}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {(submission as any).hoursWorked || 0} hours
                                                                        {submission.verifiedAt && ` • Verified ${new Date(submission.verifiedAt).toLocaleDateString()}`}
                                                                    </p>
                                                                    {status === 'REJECTED' && submission.rejectionReason && (
                                                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                                            Reason: {submission.rejectionReason}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="border border-black dark:border-white rounded-none"
                                                                    onClick={() => router.push(`/staff/work-submissions/${submission.id}`)}
                                                                >
                                                                    VIEW SUBMISSION
                                                                </Button>
                                                                <SubmissionStatusBadge status={status as any} />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}