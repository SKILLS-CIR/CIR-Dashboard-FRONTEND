"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/components/providers/auth-context"
import { api } from "@/lib/api"
import { Assignment, WorkSubmission, DayStatus } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DailyMetricsCards } from "@/components/staff/daily-metrics-cards"
import { DailyWorkCard, DailyWorkEntry, WorkProofType } from "@/components/staff/daily-work-card"
import { DailyWorkCalendar } from "@/components/staff/daily-work-calendar"
import { toast } from "sonner"
import {
    Send,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle,
    Lock,
    RefreshCw,
} from "lucide-react"

interface CalendarDayData {
    date: string
    status: DayStatus
    totalHours: number
    verifiedHours: number
    isLocked: boolean
    hasSubmissions: boolean
}

interface DailyMetrics {
    todayStatus: DayStatus
    todayHours: number
    todayVerifiedHours: number
    verifiedDaysCount: number
    missedDaysCount: number
    totalSubmittedDays: number
    totalRejectedCount: number
}

export default function StaffDashboardPage() {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date())
    
    // Data states
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [todaySubmissions, setTodaySubmissions] = useState<WorkSubmission[]>([])
    const [allSubmissions, setAllSubmissions] = useState<WorkSubmission[]>([])
    const [workEntries, setWorkEntries] = useState<Map<number, DailyWorkEntry>>(new Map())

    const today = useMemo(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    }, [])

    const isToday = useMemo(() => {
        return selectedDate.toDateString() === today.toDateString()
    }, [selectedDate, today])

    const isLocked = useMemo(() => {
        return selectedDate < today || selectedDate > today
    }, [selectedDate, today])

    // Fetch all data
    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        setIsLoading(true)
        try {
            const [assignmentsData, submissionsData, todayData] = await Promise.all([
                api.assignments.getAll(),
                api.workSubmissions.getAll(),
                api.workSubmissions.getToday(),
            ])

            setAssignments(assignmentsData)
            setAllSubmissions(submissionsData)
            setTodaySubmissions(todayData)

            // Initialize work entries from assignments
            initializeWorkEntries(assignmentsData, todayData)
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
            toast.error("Failed to load dashboard data")
        } finally {
            setIsLoading(false)
        }
    }

    function initializeWorkEntries(assignments: Assignment[], submissions: WorkSubmission[]) {
        const entries = new Map<number, DailyWorkEntry>()
        
        assignments.forEach(assignment => {
            const assignmentIdNum = typeof assignment.id === 'string' ? parseInt(assignment.id) : assignment.id as number
            const existingSubmission = submissions.find(s => {
                const subAssignmentId = typeof s.assignmentId === 'string' ? parseInt(s.assignmentId) : s.assignmentId as unknown as number
                return subAssignmentId === assignmentIdNum
            })
            
            entries.set(assignmentIdNum, {
                assignmentId: assignmentIdNum,
                responsibilityTitle: assignment.responsibility?.title || 'Untitled Responsibility',
                responsibilityDescription: assignment.responsibility?.description,
                isStaffCreated: false,
                hoursWorked: existingSubmission ? (existingSubmission as any).hoursWorked || 0 : 0,
                workDescription: existingSubmission ? (existingSubmission as any).staffComment || '' : '',
                workProofType: (existingSubmission as any)?.workProofType || 'TEXT',
                workProofText: (existingSubmission as any)?.workProofText || '',
                workProofUrl: (existingSubmission as any)?.workProofUrl || '',
                existingSubmission: existingSubmission,
            })
        })
        
        setWorkEntries(entries)
    }

    // Calculate metrics
    const metrics = useMemo((): DailyMetrics => {
        const todayDateStr = today.toISOString().split('T')[0]
        
        // Get unique dates from submissions
        const submissionDates = new Map<string, { 
            hasVerified: boolean
            hasSubmitted: boolean
            hasRejected: boolean
            totalHours: number
            verifiedHours: number
        }>()

        allSubmissions.forEach(submission => {
            const dateStr = new Date((submission as any).workDate || submission.submittedAt).toISOString().split('T')[0]
            const existing = submissionDates.get(dateStr) || {
                hasVerified: false,
                hasSubmitted: false,
                hasRejected: false,
                totalHours: 0,
                verifiedHours: 0,
            }
            
            const status = submission.assignment?.status || submission.status
            const hours = (submission as any).hoursWorked || 0
            
            existing.totalHours += hours
            
            if (status === 'VERIFIED') {
                existing.hasVerified = true
                existing.verifiedHours += hours
            } else if (status === 'SUBMITTED') {
                existing.hasSubmitted = true
            } else if (status === 'REJECTED') {
                existing.hasRejected = true
            }
            
            submissionDates.set(dateStr, existing)
        })

        // Calculate today's metrics
        const todayData = submissionDates.get(todayDateStr)
        let todayStatus: DayStatus = 'NOT_SUBMITTED'
        
        if (todayData) {
            if (todayData.hasRejected && !todayData.hasVerified && !todayData.hasSubmitted) {
                todayStatus = 'REJECTED'
            } else if (todayData.hasVerified && !todayData.hasSubmitted && !todayData.hasRejected) {
                todayStatus = 'VERIFIED'
            } else if (todayData.hasSubmitted || todayData.hasVerified) {
                todayStatus = todayData.hasRejected ? 'PARTIAL' : 'SUBMITTED'
            }
        }

        // Count verified days
        let verifiedDaysCount = 0
        submissionDates.forEach((data) => {
            if (data.hasVerified) {
                verifiedDaysCount++
            }
        })

        // Calculate missed days (working days without submission in the past 30 days)
        let missedDaysCount = 0
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        for (let d = new Date(thirtyDaysAgo); d < today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0]
            if (!submissionDates.has(dateStr)) {
                missedDaysCount++
            }
        }

        return {
            todayStatus,
            todayHours: todayData?.totalHours || 0,
            todayVerifiedHours: todayData?.verifiedHours || 0,
            verifiedDaysCount,
            missedDaysCount,
            totalSubmittedDays: submissionDates.size,
            totalRejectedCount: allSubmissions.filter(s => 
                s.assignment?.status === 'REJECTED' || s.status === 'REJECTED'
            ).length,
        }
    }, [allSubmissions, today])

    // Generate calendar data
    const calendarData = useMemo((): CalendarDayData[] => {
        const data: CalendarDayData[] = []
        const submissionsByDate = new Map<string, WorkSubmission[]>()

        allSubmissions.forEach(submission => {
            const dateStr = new Date((submission as any).workDate || submission.submittedAt).toISOString().split('T')[0]
            const existing = submissionsByDate.get(dateStr) || []
            existing.push(submission)
            submissionsByDate.set(dateStr, existing)
        })

        submissionsByDate.forEach((submissions, dateStr) => {
            const date = new Date(dateStr)
            let status: DayStatus = 'NOT_SUBMITTED'
            let totalHours = 0
            let verifiedHours = 0

            submissions.forEach(sub => {
                const hours = (sub as any).hoursWorked || 0
                totalHours += hours
                
                const subStatus = sub.assignment?.status || sub.status
                if (subStatus === 'VERIFIED') {
                    verifiedHours += hours
                }
            })

            // Determine day status based on submissions
            const hasVerified = submissions.some(s => (s.assignment?.status || s.status) === 'VERIFIED')
            const hasSubmitted = submissions.some(s => (s.assignment?.status || s.status) === 'SUBMITTED')
            const hasRejected = submissions.some(s => (s.assignment?.status || s.status) === 'REJECTED')

            if (hasVerified && !hasSubmitted && !hasRejected) {
                status = 'VERIFIED'
            } else if (hasRejected && !hasVerified && !hasSubmitted) {
                status = 'REJECTED'
            } else if (hasSubmitted || hasVerified) {
                status = hasRejected ? 'PARTIAL' : 'SUBMITTED'
            }

            data.push({
                date: dateStr,
                status,
                totalHours,
                verifiedHours,
                isLocked: date < today,
                hasSubmissions: submissions.length > 0,
            })
        })

        return data
    }, [allSubmissions, today])

    // Handle work entry changes
    function handleWorkEntryChange(assignmentId: number, field: keyof DailyWorkEntry, value: string | number) {
        setWorkEntries(prev => {
            const newMap = new Map(prev)
            const entry = newMap.get(assignmentId)
            if (entry) {
                newMap.set(assignmentId, { ...entry, [field]: value })
            }
            return newMap
        })
    }

    // Handle daily submission
    async function handleSubmitDailyWork() {
        const entries = Array.from(workEntries.values())
        const entriesToSubmit = entries.filter(e => 
            e.hoursWorked > 0 && !e.existingSubmission
        )

        if (entriesToSubmit.length === 0) {
            toast.error("Please enter hours for at least one responsibility")
            return
        }

        if (!user?.id) {
            toast.error("User not authenticated")
            return
        }

        setIsSubmitting(true)
        try {
            for (const entry of entriesToSubmit) {
                // Use Prisma connect pattern expected by backend
                await api.workSubmissions.create({
                    assignment: { connect: { id: entry.assignmentId } },
                    staff: { connect: { id: parseInt(user.id) } },
                    hoursWorked: entry.hoursWorked,
                    staffComment: entry.workDescription || undefined,
                    workProofType: entry.workProofType as 'PDF' | 'IMAGE' | 'TEXT' | undefined,
                    workProofText: entry.workProofText || undefined,
                    workProofUrl: entry.workProofUrl || undefined,
                })
            }

            toast.success(`Submitted ${entriesToSubmit.length} work entries for today`)
            await fetchDashboardData()
        } catch (error: any) {
            console.error("Failed to submit work:", error)
            toast.error(error.message || "Failed to submit work")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Check if there are any unsubmitted entries
    const hasUnsubmittedWork = useMemo(() => {
        return Array.from(workEntries.values()).some(e => 
            e.hoursWorked > 0 && !e.existingSubmission
        )
    }, [workEntries])

    // Calculate total hours for today
    const todayTotalHours = useMemo(() => {
        return Array.from(workEntries.values()).reduce((sum, e) => sum + (e.hoursWorked || 0), 0)
    }, [workEntries])

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
                    <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user?.name || 'Staff'}. Submit your daily work here.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Daily Metrics */}
            <DailyMetricsCards metrics={metrics} />

            {/* Rejected Alert */}
            {metrics.totalRejectedCount > 0 && (
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertCircle className="h-5 w-5" />
                            {metrics.totalRejectedCount} Rejected Submission{metrics.totalRejectedCount > 1 ? 's' : ''}
                        </CardTitle>
                        <CardDescription className="text-red-600 dark:text-red-400">
                            Some of your work requires revision. Please review the rejected items below.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Daily Work View - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Date Header */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        {isToday ? "Today's Work" : selectedDate.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        {isLocked ? (
                                            <>
                                                <Lock className="h-4 w-4" />
                                                {selectedDate < today 
                                                    ? "This date is locked. Past submissions cannot be modified."
                                                    : "Future dates are not available for submission."
                                                }
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-4 w-4" />
                                                Total: {todayTotalHours} hours
                                            </>
                                        )}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Work Entries */}
                    {workEntries.size === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    {isToday 
                                        ? "No responsibilities assigned for today. Contact your manager to get assigned responsibilities."
                                        : "No work entries for this date."
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {Array.from(workEntries.values()).map(entry => (
                                <DailyWorkCard
                                    key={entry.assignmentId}
                                    entry={entry}
                                    isLocked={isLocked || !!entry.existingSubmission}
                                    onChange={handleWorkEntryChange}
                                />
                            ))}
                        </div>
                    )}

                    {/* Submit Button */}
                    {isToday && !isLocked && workEntries.size > 0 && (
                        <Card className="border-primary">
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Ready to submit?</p>
                                        <p className="text-sm text-muted-foreground">
                                            {hasUnsubmittedWork 
                                                ? `You have work entries ready to submit (${todayTotalHours} total hours)`
                                                : "All work for today has been submitted"
                                            }
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={handleSubmitDailyWork}
                                        disabled={isSubmitting || !hasUnsubmittedWork}
                                        size="lg"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Submit Today's Work
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Past Date Message */}
                    {!isToday && isLocked && selectedDate < today && (
                        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                            <CardContent className="py-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-amber-800 dark:text-amber-300">
                                            {calendarData.find(d => d.date === selectedDate.toISOString().split('T')[0])?.hasSubmissions
                                                ? "This date's submissions are locked"
                                                : "No work submitted for this date"
                                            }
                                        </p>
                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                            {calendarData.find(d => d.date === selectedDate.toISOString().split('T')[0])?.hasSubmissions
                                                ? "Past submissions cannot be modified. Contact your manager for any queries."
                                                : "No work was submitted. Please contact your manager for queries."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Calendar View - Right Column */}
                <div>
                    <DailyWorkCalendar
                        calendarData={calendarData}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                    />
                </div>
            </div>
        </div>
    )
}
